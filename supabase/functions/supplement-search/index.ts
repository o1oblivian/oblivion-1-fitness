import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface SearchResult {
  id: string;
  name: string;
  brand: string;
  category: string;
  dosage: string;
  ingredients: string[];
  source: string;
}

const SUPPLEMENT_KEYWORDS = [
  "supplement", "vitamin", "mineral", "capsule", "tablet", "softgel", "caps",
  "mg", "mcg", "iu", "protein powder", "whey", "casein", "creatine", "bcaa",
  "amino acid", "pre workout", "pre-workout", "post workout", "l-carnitine",
  "l-arginine", "l-glutamine", "l-tyrosine", "beta alanine", "nitric oxide",
  "omega-3", "omega 3", "fish oil", "krill oil", "flax oil", "cla",
  "multivitamin", "multi-vitamin", "zinc", "magnesium", "calcium", "iron",
  "vitamin c", "vitamin d", "vitamin b", "vitamin b12", "vitamin k", "vitamin e",
  "vitamin a", "folic acid", "folate", "biotin", "selenium", "chromium",
  "collagen", "glucosamine", "chondroitin", "msm", "melatonin", "ashwagandha",
  "rhodiola", "ginseng", "turmeric", "curcumin", "probiotic", "prebiotic",
  "coq10", "nac", "green tea extract", "caffeine", "theanine", "5-htp",
  "creatine monohydrate", "creatine hcl", "hmb", "leucine", "eaas",
  "electrolyte", "mass gainer", "isolate", "concentrate", "plant protein",
  "pea protein", "thermogenic", "fat burner", "adaptogen", "nootropic",
];

const EXCLUDE_KEYWORDS = [
  "biscuit", "cookie", "cake", "chocolate bar", "candy", "sweets",
  "crisps", "chips", "snack cake", "jam", "honey", "syrup",
  "yogurt", "yoghurt", "milk", "cheese", "butter", "cream",
  "bread", "bagel", "muffin", "pasta", "noodle", "rice", "cereal",
  "soup", "sauce", "ketchup", "mayonnaise", "dressing",
  "frozen", "ready meal", "canned", "pet food", "baby food",
  "flour", "sugar", "salt", "spice", "seasoning",
];

const PRESCRIPTION_EXCLUDE_KEYWORDS = [
  "injectable", "injection", "prescription", "rx only",
  "testosterone cypionate", "testosterone enanthate", "anabolic", "steroid",
  "clenbuterol", "dnp", "growth hormone", "hgh", "somatropin", "insulin",
  "ephedrine", "pseudoephedrine",
];

function isLikelySupplement(productName: string, categories: string, ingredientsText: string): boolean {
  const text = `${productName} ${categories} ${ingredientsText}`.toLowerCase();
  for (const kw of EXCLUDE_KEYWORDS) { if (text.includes(kw)) return false; }
  for (const kw of SUPPLEMENT_KEYWORDS) { if (text.includes(kw)) return true; }
  return false;
}

function isPrescriptionOnly(productName: string, ingredientsText: string): boolean {
  const text = `${productName} ${ingredientsText}`.toLowerCase();
  for (const kw of PRESCRIPTION_EXCLUDE_KEYWORDS) { if (text.includes(kw)) return true; }
  return false;
}

function categorize(productName: string, categories: string): string {
  const text = `${productName} ${categories}`.toLowerCase();
  if (text.includes('protein') || text.includes('whey') || text.includes('casein')) return 'Protein';
  if (text.includes('creatine')) return 'Cellular Energy & Power';
  if (text.includes('pre-workout') || text.includes('pre workout') || text.includes('nitric')) return 'Nitric Oxide & Drive';
  if (text.includes('vitamin') || text.includes('multivitamin') || text.includes('mineral')) return 'Vitamins & Minerals';
  if (text.includes('omega') || text.includes('fish oil') || text.includes('krill')) return 'Omega & Fatty Acids';
  if (text.includes('amino') || text.includes('bcaa')) return 'Amino Acids';
  if (text.includes('prebiotic') || text.includes('probiotic') || text.includes('digestive')) return 'Gut & Digestive';
  if (text.includes('sleep') || text.includes('melatonin') || text.includes('magnesium')) return 'Sleep & Recovery';
  if (text.includes('energy') || text.includes('caffeine') || text.includes('green tea')) return 'Energy & Metabolism';
  if (text.includes('joint') || text.includes('collagen') || text.includes('glucosamine')) return 'Joint & Connective Tissue';
  if (text.includes('immune') || text.includes('zinc') || text.includes('elderberry')) return 'Immune Support';
  if (text.includes('adaptogen') || text.includes('ashwagandha') || text.includes('rhodiola')) return 'Adaptogens & Stress';
  return 'General Wellness';
}

const FALLBACK_SUPPLEMENTS: SearchResult[] = [
  { id: 'fallback-magnesium-glycinate', name: 'Magnesium Glycinate', brand: 'General Wellness', category: 'Sleep & Recovery', dosage: '200 mg', ingredients: ['Magnesium bisglycinate'], source: 'Verified supplement catalog' },
  { id: 'fallback-vitamin-d3', name: 'Vitamin D3', brand: 'General Wellness', category: 'Vitamins & Minerals', dosage: '1000 IU', ingredients: ['Cholecalciferol'], source: 'Verified supplement catalog' },
  { id: 'fallback-omega-3', name: 'Omega-3 Fish Oil', brand: 'General Wellness', category: 'Omega & Fatty Acids', dosage: '1000 mg', ingredients: ['EPA', 'DHA', 'Fish oil'], source: 'Verified supplement catalog' },
  { id: 'fallback-creatine', name: 'Creatine Monohydrate', brand: 'General Wellness', category: 'Cellular Energy & Power', dosage: '5 g', ingredients: ['Creatine monohydrate'], source: 'Verified supplement catalog' },
  { id: 'fallback-whey', name: 'Whey Protein Isolate', brand: 'General Wellness', category: 'Protein', dosage: '30 g', ingredients: ['Whey protein isolate'], source: 'Verified supplement catalog' },
  { id: 'fallback-ashwagandha', name: 'Ashwagandha Extract', brand: 'General Wellness', category: 'Adaptogens & Stress', dosage: '300 mg', ingredients: ['Ashwagandha root extract'], source: 'Verified supplement catalog' },
];

function getFallbackResults(query: string): SearchResult[] {
  const q = query.toLowerCase().trim();
  return FALLBACK_SUPPLEMENTS.filter((s) => {
    const text = [s.name, s.brand, s.category, ...s.ingredients].join(' ').toLowerCase();
    return text.includes(q) || q.split(/\s+/).every((t) => text.includes(t));
  });
}

function getSupabaseClient() {
  return createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
}

async function verifyAuth(req: Request): Promise<{ email: string } | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) return null;
  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) return null;
  return { email: data.user.email || "" };
}

async function checkRateLimit(email: string, fnName: string, maxPerMin = 30): Promise<boolean> {
  const supabase = getSupabaseClient();
  const oneMinAgo = new Date(Date.now() - 60000).toISOString();
  const { count } = await supabase
    .from("rate_limits")
    .select("*", { count: "exact", head: true })
    .eq("user_email", email)
    .eq("function_name", fnName)
    .gte("created_at", oneMinAgo);
  if ((count ?? 0) >= maxPerMin) return false;
  await supabase.from("rate_limits").insert({ user_email: email, function_name: fnName });
  return true;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const user = await verifyAuth(req);
  if (!user) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  if (!(await checkRateLimit(user.email, "supplement-search", 30))) {
    return new Response(
      JSON.stringify({ error: "Rate limit exceeded. Try again in a minute." }),
      { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  let extractedQuery = "";

  try {
    const url = new URL(req.url);
    let queryParam = url.searchParams.get("q") || "";
    if (!queryParam && req.method !== "GET") {
      const body = await req.json().catch(() => ({}));
      queryParam = typeof body.q === 'string' ? body.q : '';
    }
    extractedQuery = queryParam;

    if (!queryParam || queryParam.trim().length < 2) {
      return new Response(
        JSON.stringify({ results: [], message: "Enter at least 2 characters" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const query = queryParam.trim();
    const encodedQuery = encodeURIComponent(query);

    const generalApiUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodedQuery}&search_simple=1&action=process&json=1&page_size=40&fields=code,product_name,brands,categories,quantity,ingredients_text,nutriments`;

    const generalResponse = await fetch(generalApiUrl, { headers: { "User-Agent": "O1FCFitnessApp/1.0 (supplement search)" } });

    if (!generalResponse.ok) throw new Error(`External API returned ${generalResponse.status}`);

    const generalData = await generalResponse.json();
    const allProducts = generalData.products || [];

    const supplementProducts = allProducts.filter((p: any) => {
      if (!p.product_name || !p.product_name.trim()) return false;
      if (!isLikelySupplement(p.product_name, p.categories || "", p.ingredients_text || "")) return false;
      if (isPrescriptionOnly(p.product_name, p.ingredients_text || "")) return false;
      return true;
    });

    const results: SearchResult[] = supplementProducts.slice(0, 15).map((p: any) => {
      const ingredientsText = p.ingredients_text || "";
      const ingredients = ingredientsText ? ingredientsText.split(/[,;]/).map((s: string) => s.trim()).filter(Boolean).slice(0, 8) : [];
      return {
        id: `off_${p.code || p.product_name}`,
        name: p.product_name.trim(),
        brand: (p.brands || "Unknown Brand").split(",")[0].trim(),
        category: categorize(p.product_name, p.categories || ""),
        dosage: p.quantity || "1 Serving",
        ingredients: ingredients.length > 0 ? ingredients : [p.product_name.trim()],
        source: "Open Food Facts",
      };
    });

    return new Response(
      JSON.stringify({ results, count: results.length }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const fallbackResults = extractedQuery.trim().length >= 2 ? getFallbackResults(extractedQuery) : [];
    return new Response(
      JSON.stringify({ results: fallbackResults, fallback: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
