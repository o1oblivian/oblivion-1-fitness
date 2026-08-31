import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Curated high-quality fitness/athletic wallpaper URLs from free sources
// These are direct image links from Unsplash (no API key needed for hotlinking)
const WALLPAPER_POOLS: Record<string, string[]> = {
  auto: [
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1605296867424-35fc25c9212a?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1576678927484-cc907957088c?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?w=1080&q=80&fit=crop",
  ],
  mountains: [
    "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1434394354979-a235cd36269d?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1500534623283-312aade485b7?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1080&q=80&fit=crop",
  ],
  ocean: [
    "https://images.unsplash.com/photo-1505118380757-91f5f5632de0?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1476673160081-cf065607f449?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1484291470158-b8f8d608850d?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1502680390725-be18b694df06?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1519046904884-53103b34b206?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1468413253725-0d5181091126?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1530053969600-caed2596d242?w=1080&q=80&fit=crop",
  ],
  forest: [
    "https://images.unsplash.com/photo-1448375240586-882707db888b?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1476231682828-37e571bc172f?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1502082553048-f009c37129b9?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1473448912268-2022ce9509d8?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1425913397330-cf8af2ff40a1?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1500829243541-74b677fecc30?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1440581572325-0bea30075d9d?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1523712999610-f77fbcfc3843?w=1080&q=80&fit=crop",
  ],
  desert: [
    "https://images.unsplash.com/photo-1509316785289-025f5b846b35?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1473580044384-7ba9967e16a0?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1542401886-65d6c61db217?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1504545965005-0e41bfa1ef72?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1496258244616-19c4f72c5ee2?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1494564605686-2e931f77a8e2?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1474044159687-1ee9f3a51722?w=1080&q=80&fit=crop",
  ],
  city: [
    "https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1514565131-fce0801e5785?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1444723121867-7a241cacace9?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1502899576159-f224dc2349fa?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1470219556762-1fd5b28f8e5e?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1532289735003-fa4d3d3f1d56?w=1080&q=80&fit=crop",
  ],
  aurora: [
    "https://images.unsplash.com/photo-1483347756197-71ef80e95f73?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1579033461380-adb47c3eb938?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1494243762909-b498c7e440a9?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1464457312035-3d7d0e0c058e?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1507400492013-162706c8c05e?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1475274047050-1d0c55b7e09d?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1528722828814-77b9b83aafb2?w=1080&q=80&fit=crop",
  ],
  lakes: [
    "https://images.unsplash.com/photo-1439066615861-d1af74d74000?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1470770903676-69b98201ea1c?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1433838552652-f9a46b332c40?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1445262102387-5fbb30a5e59d?w=1080&q=80&fit=crop",
    "https://images.unsplash.com/photo-1414609245224-afa02bfb3fda?w=1080&q=80&fit=crop",
  ],
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const category = url.searchParams.get("category") || "auto";
    const pool = WALLPAPER_POOLS[category] || WALLPAPER_POOLS.auto;

    // Shuffle and return all images from the pool
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    const images = shuffled.map((imgUrl, i) => ({
      id: `${category}-${i}`,
      url: imgUrl,
      alt: `${category} wallpaper`,
    }));

    return new Response(JSON.stringify({ images }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: (err as Error).message, images: [] }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
