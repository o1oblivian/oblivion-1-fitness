import fs from 'fs';
import esbuild from 'esbuild';

const travelModalCode = `import {
  x as s,
  a6 as Z,
  bc as ee,
  aM as te,
  aL as se,
  r as e,
  a8 as ae,
  bd as A,
  b as E,
  F as D,
  aq as M,
  k as O,
  n as U,
  o as re,
  aQ as R,
  aY as G,
  y as ne,
  V as ie,
  ar as ce,
  E as le,
  Y as de,
  aP as oe,
  ag as o,
  be as xe,
  aD as _e,
  aC as at
} from "./index-BWUawsaP.js";

function isUserEntitledToTravel() {
  try {
    if (typeof window === "undefined") return false;
    if (localStorage.getItem("o1fc_vip_creator") === "true") return true;
    const cachedTier = localStorage.getItem("o1fc_cached_tier");
    if (cachedTier && ["premium", "premium_travel", "founder_pass", "coach_pro"].includes(cachedTier)) return true;
    const subStr = localStorage.getItem("o1fc_active_subscription");
    if (subStr) {
      const sub = JSON.parse(subStr);
      if (sub.status === "active" || ["premium", "premium_travel", "founder_pass", "coach_pro"].includes(sub.tier)) return true;
    }
    const profStr = localStorage.getItem("o1fc_user_profile_data") || localStorage.getItem("o1fc_user_profile");
    if (profStr) {
      const prof = JSON.parse(profStr);
      if (prof.is_pro || ["premium", "premium_travel", "founder_pass", "coach_pro"].includes(prof.subscription_tier)) return true;
    }
  } catch (err) {}
  return false;
}

const TravelPassModal = ({ isOpen: m, onClose: p, onOpenPayPlan: v, showToast: n }) => {
  const [query, setQuery] = s.useState("");
  const [arrivalDate, setArrivalDate] = s.useState("");
  const [departureDate, setDepartureDate] = s.useState("");
  const [isSearching, setIsSearching] = s.useState(false);
  const [hasSearched, setHasSearched] = s.useState(false);
  const [activeTab, setActiveTab] = s.useState("athletes");
  const [radiusKm, setRadiusKm] = s.useState(50);
  const [gyms, setGyms] = s.useState([]);
  const [athletes, setAthletes] = s.useState([]);
  const [sentRequests, setSentRequests] = s.useState(new Set());
  const [promoCode, setPromoCode] = s.useState("");
  const [promoNotice, setPromoNotice] = s.useState(null);
  
  // Geocoding autocompletion state
  const [suggestions, setSuggestions] = s.useState([]);
  const [isGeocoding, setIsGeocoding] = s.useState(false);
  const [selectedDestination, setSelectedDestination] = s.useState(null);
  
  // Active travel mode state
  const [activeTravel, setActiveTravel] = s.useState(() => {
    try {
      const saved = localStorage.getItem("o1fc_travel_mode");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isSubscribed = isUserEntitledToTravel();
  const currentUserEmail = Z() || "athlete@ofc.com";
  const userProfile = ee(currentUserEmail);
  const athleteName = userProfile?.athleteName || currentUserEmail.split("@")[0] || "Athlete";
  const searchTimeoutRef = s.useRef(null);
  const geocodeTimeoutRef = s.useRef(null);

  // Sync active travel status from localStorage
  s.useEffect(() => {
    if (m) {
      try {
        const saved = localStorage.getItem("o1fc_travel_mode");
        if (saved) {
          const parsed = JSON.parse(saved);
          setActiveTravel(parsed);
          if (parsed.travel_city && !query) {
            setQuery(parsed.travel_city);
          }
        }
      } catch {}
    }
  }, [m]);

  // Geocoding suggestion search
  const performGeocode = s.useCallback(async (val) => {
    const text = val.trim();
    if (text.length < 2) {
      setSuggestions([]);
      setIsGeocoding(false);
      return;
    }
    setIsGeocoding(true);
    try {
      const nomUrl = "https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=5&q=" + encodeURIComponent(text);
      const res = await fetch(nomUrl, {
        headers: { "Accept": "application/json" }
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const mapped = data.map(item => {
            const addr = item.address || {};
            const city = addr.city || addr.town || addr.village || addr.municipality || addr.county || item.display_name.split(",")[0].trim();
            const country = addr.country || item.display_name.split(",").pop().trim();
            return {
              displayLabel: item.display_name,
              city,
              country,
              lat: parseFloat(item.lat),
              lng: parseFloat(item.lon)
            };
          });
          setSuggestions(mapped);
          setIsGeocoding(false);
          return;
        }
      }
    } catch (nomErr) {
      console.warn("[TravelHub] Nominatim search failed, trying Photon:", nomErr);
    }

    // Fallback: Photon API
    try {
      const photUrl = "https://photon.komoot.io/api/?q=" + encodeURIComponent(text) + "&limit=5";
      const res2 = await fetch(photUrl);
      if (res2.ok) {
        const pData = await res2.json();
        if (pData?.features?.length > 0) {
          const mapped2 = pData.features.map(f => {
            const p = f.properties || {};
            const coords = f.geometry?.coordinates || [0, 0];
            const city = p.city || p.name || "City";
            const country = p.country || "Global";
            const displayLabel = [p.name, p.city, p.state, p.country].filter(Boolean).join(", ");
            return {
              displayLabel,
              city,
              country,
              lat: coords[1],
              lng: coords[0]
            };
          });
          setSuggestions(mapped2);
          setIsGeocoding(false);
          return;
        }
      }
    } catch (photErr) {
      console.warn("[TravelHub] Photon search failed:", photErr);
    }
    setSuggestions([]);
    setIsGeocoding(false);
  }, []);

  // Search local athletes & gyms around target destination
  const searchDest = s.useCallback(async (t, l) => {
    const r = t.trim();
    if (!r) {
      setGyms([]);
      setAthletes([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    setHasSearched(true);
    const N = l ?? radiusKm;
    try {
      const [gymList, athleteList] = await Promise.all([
        te(r),
        se({ city_town: r, searchQuery: r, maxDistanceKm: N })
      ]);
      setGyms(gymList || []);
      setAthletes(athleteList || []);
    } catch (err) {
      console.warn("[TravelHub] Search error:", err);
    } finally {
      setIsSearching(false);
    }
  }, [radiusKm]);

  // Handle typing with debounced geocoding and local search
  const handleInputChange = (text) => {
    setQuery(text);
    if (geocodeTimeoutRef.current) clearTimeout(geocodeTimeoutRef.current);
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (text.trim().length >= 2) {
      geocodeTimeoutRef.current = setTimeout(() => {
        performGeocode(text);
      }, 250);
      searchTimeoutRef.current = setTimeout(() => {
        searchDest(text);
      }, 350);
    } else {
      setSuggestions([]);
      setGyms([]);
      setAthletes([]);
      setHasSearched(false);
    }
  };

  const handleSelectSuggestion = (loc) => {
    o("medium");
    setSelectedDestination(loc);
    setQuery(loc.displayLabel);
    setSuggestions([]);
    searchDest(loc.city);
  };

  // Activate Travel Mode
  const handleActivateTravelMode = async () => {
    if (!isSubscribed) {
      o("medium");
      p();
      v?.("premium_travel");
      n?.("Travel Mode is an O1FC Pro feature. Select a pass to unlock global matching.", "info");
      return;
    }

    const dest = selectedDestination || (query.trim() ? {
      city: query.trim().split(",")[0],
      country: query.trim().split(",").pop().trim() || "Global",
      lat: 51.5074,
      lng: -0.1278
    } : null);

    if (!dest) {
      n?.("Please enter a destination city to activate Travel Mode.", "error");
      return;
    }

    o("success");
    const payload = {
      is_travel_mode: true,
      travel_city: dest.city,
      travel_country: dest.country,
      travel_latitude: dest.lat,
      travel_longitude: dest.lng,
      travel_radius_km: radiusKm,
      travel_active_at: new Date().toISOString()
    };

    if (at() && _e && currentUserEmail) {
      try {
        await _e.from("buddy_profiles").update(payload).eq("user_email", currentUserEmail.toLowerCase());
      } catch (err) {
        console.warn("[buddy_profiles] Supabase travel update error:", err);
      }
    }

    localStorage.setItem("o1fc_travel_mode", JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("o1fc-travel-mode-updated", { detail: payload }));
    setActiveTravel(payload);
    n?.("Travel Mode activated for " + dest.city + "! Discover radar updated.", "success");
    p();
  };

  // Reset to GPS
  const handleResetToGPS = async () => {
    o("medium");
    if (at() && _e && currentUserEmail) {
      try {
        await _e.from("buddy_profiles").update({ is_travel_mode: false }).eq("user_email", currentUserEmail.toLowerCase());
      } catch (err) {
        console.warn("[buddy_profiles] Reset GPS error:", err);
      }
    }

    localStorage.removeItem("o1fc_travel_mode");
    window.dispatchEvent(new CustomEvent("o1fc-travel-mode-updated", { detail: { is_travel_mode: false } }));
    setActiveTravel(null);
    setSelectedDestination(null);
    setQuery("");
    n?.("Travel Mode deactivated. Returned to live GPS.", "info");
  };

  // Connection request
  const handleSendConnection = async (item) => {
    if (!sentRequests.has(item.user.id)) {
      o("medium");
      try {
        const destNote = query ? " traveling to " + query.split(",")[0] : "";
        await xe(currentUserEmail, athleteName, "", item.user.user_email, "Hey " + item.user.user_name + "! I'm an athlete" + destNote + " and would love to train together.");
        setSentRequests(prev => new Set(prev).add(item.user.id));
        n?.("Connection request sent to " + item.user.user_name, "success");
        o("success");
      } catch {
        n?.("Could not send connection request.", "error");
      }
    }
  };

  const handleApplyPromo = () => {
    if (promoCode.trim().toUpperCase()) {
      o("medium");
      setPromoNotice({ text: "Promo codes are applied at checkout", type: "info" });
      n?.("Enter your promotion code at checkout for discount", "success");
    }
  };

  if (!m) return null;

  return e.jsx("div", {
    className: "fixed inset-0 z-[999] bg-black/60 dark:bg-black/80 backdrop-blur-md overflow-y-auto font-sans select-none flex justify-center items-start sm:p-4",
    children: e.jsxs("div", {
      className: "bg-white dark:bg-[#0D0D0E] text-zinc-900 dark:text-white w-full max-w-lg min-h-screen sm:min-h-0 sm:rounded-3xl border border-zinc-200/80 dark:border-zinc-800/80 shadow-2xl overflow-hidden flex flex-col my-0 sm:my-8 animate-in fade-in zoom-in-95 duration-200",
      children: [
        e.jsx("div", {
          className: "w-full flex justify-center pt-2.5 pb-1 sm:hidden",
          children: e.jsx("div", { className: "w-10 h-1 bg-zinc-300 dark:bg-zinc-800 rounded-full" })
        }),
        e.jsxs("div", {
          className: "px-5 py-4 pt-[max(1rem,calc(env(safe-area-inset-top,0px)+0.75rem))] sm:pt-4 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between",
          children: [
            e.jsxs("button", {
              type: "button",
              onClick: p,
              className: "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1 text-xs font-semibold tracking-tight transition-colors cursor-pointer",
              children: [e.jsx(ae, { className: "w-4 h-4" }), e.jsx("span", { children: "Back" })]
            }),
            e.jsxs("div", {
              className: "flex items-center gap-2",
              children: [
                e.jsx(A, { className: "w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" }),
                e.jsx("span", { className: "text-xs font-bold tracking-widest uppercase font-mono text-zinc-800 dark:text-zinc-200", children: "Travel Hub" })
              ]
            }),
            e.jsx("button", {
              type: "button",
              onClick: p,
              className: "btn-nude-close",
              children: e.jsx(E, { className: "w-4 h-4" })
            })
          ]
        }),
        e.jsxs("div", {
          className: "p-5 sm:p-6 pb-[max(2.5rem,calc(env(safe-area-inset-bottom,0px)+1.75rem))] space-y-6 flex-1 overflow-y-auto",
          children: [
            activeTravel?.is_travel_mode && e.jsxs("div", {
              className: "p-4 rounded-2xl bg-gradient-to-r from-red-600/15 via-red-500/10 to-transparent border border-red-500/30 flex items-center justify-between gap-3 shadow-sm",
              children: [
                e.jsxs("div", {
                  className: "space-y-1 min-w-0",
                  children: [
                    e.jsxs("div", {
                      className: "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[9px] font-mono font-bold tracking-widest uppercase",
                      children: [e.jsx("span", { children: "✈" }), "Travel Mode Active"]
                    }),
                    e.jsxs("h4", {
                      className: "text-xs font-bold text-white truncate",
                      children: ["Visiting ", activeTravel.travel_city, activeTravel.travel_country ? ", " + activeTravel.travel_country : ""]
                    }),
                    e.jsx("p", {
                      className: "text-[10px] text-zinc-400 leading-tight",
                      children: "Discover deck is currently centered at your destination."
                    })
                  ]
                }),
                e.jsx("button", {
                  type: "button",
                  onClick: handleResetToGPS,
                  className: "px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 hover:text-white text-xs font-bold shrink-0 active:scale-95 transition-all border border-zinc-700 cursor-pointer",
                  children: "Reset to GPS"
                })
              ]
            }),
            e.jsxs("div", {
              className: "space-y-2",
              children: [
                e.jsxs("div", {
                  className: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] font-semibold",
                  children: [e.jsx(A, { className: "w-3 h-3 text-zinc-500 dark:text-zinc-400" }), e.jsx("span", { children: "TINDER PASSPORT EQUIVALENT" })]
                }),
                e.jsx("h2", {
                  className: "text-xl sm:text-2xl font-bold tracking-tight text-zinc-900 dark:text-white",
                  children: "Train Anywhere in the World"
                }),
                e.jsx("p", {
                  className: "text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed",
                  children: "Set your destination city and trip dates to discover verified gym partners, book day passes, and train with local athletes before you land."
                })
              ]
            }),
            e.jsxs("div", {
              className: "space-y-4",
              children: [
                e.jsxs("div", {
                  className: "space-y-1.5 relative",
                  children: [
                    e.jsxs("label", {
                      className: "text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center justify-between",
                      children: [
                        e.jsx("span", { children: "Destination City / Country (Global Search)" }),
                        (isSearching || isGeocoding) && e.jsxs("span", {
                          className: "text-zinc-500 font-normal normal-case flex items-center gap-1",
                          children: [e.jsx(D, { className: "w-3 h-3 animate-spin text-zinc-500 dark:text-zinc-400" }), "Searching worldwide..."]
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "relative",
                      children: [
                        e.jsx(M, { className: "w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" }),
                        e.jsx("input", {
                          type: "text",
                          value: query,
                          onChange: t => handleInputChange(t.target.value),
                          placeholder: "Type any city, state, or country...",
                          className: "w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-500 dark:focus:border-zinc-500 rounded-xl pl-10 pr-9 py-3 text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 outline-none transition-colors"
                        }),
                        query && e.jsx("button", {
                          type: "button",
                          onClick: () => { setQuery(""); setSuggestions([]); setSelectedDestination(null); },
                          className: "absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:text-zinc-500 dark:hover:text-zinc-300 cursor-pointer p-0.5",
                          children: e.jsx(E, { className: "w-3.5 h-3.5" })
                        })
                      ]
                    }),
                    suggestions.length > 0 && e.jsx("div", {
                      className: "absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-[#12141A] border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-2xl max-h-56 overflow-y-auto p-1 space-y-0.5",
                      children: suggestions.map((sug, sIdx) => e.jsxs("button", {
                        key: sIdx,
                        type: "button",
                        onClick: () => handleSelectSuggestion(sug),
                        className: "w-full text-left p-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800/80 flex items-center gap-2.5 transition-colors cursor-pointer group",
                        children: [
                          e.jsx(M, { className: "w-3.5 h-3.5 text-zinc-400 group-hover:text-red-500 shrink-0" }),
                          e.jsxs("div", {
                            className: "min-w-0 flex-1",
                            children: [
                              e.jsx("p", { className: "text-xs font-semibold text-zinc-900 dark:text-white truncate", children: sug.city + ", " + sug.country }),
                              e.jsx("p", { className: "text-[10px] text-zinc-500 truncate", children: sug.displayLabel })
                            ]
                          })
                        ]
                      }))
                    })
                  ]
                }),
                e.jsxs("div", {
                  className: "space-y-2 pt-1",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        e.jsx("span", { className: "text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest", children: "Global Hub Presets" }),
                        e.jsx("span", { className: "text-[9px] text-zinc-400 dark:text-zinc-500", children: "One-Tap Travel" })
                      ]
                    }),
                    e.jsx("div", {
                      className: "flex flex-wrap gap-1.5",
                      children: [
                        { name: "Melbourne", city: "Melbourne", country: "Australia", lat: -37.8136, lng: 144.9631, flag: "🇦🇺", hub: "Chapel St / Doherty'\''s" },
                        { name: "Sydney", city: "Sydney", country: "Australia", lat: -33.8688, lng: 151.2093, flag: "🇦🇺", hub: "Bondi / Surry Hills" },
                        { name: "Gold Coast", city: "Gold Coast", country: "Australia", lat: -28.0167, lng: 153.4000, flag: "🇦🇺", hub: "Surfers / Burleigh" },
                        { name: "Miami", city: "Miami", country: "United States", lat: 25.7617, lng: -80.1918, flag: "🇺🇸", hub: "South Beach / Brickell" },
                        { name: "London", city: "London", country: "United Kingdom", lat: 51.5074, lng: -0.1278, flag: "🇬🇧", hub: "Shoreditch / Soho" },
                        { name: "Los Angeles", city: "Los Angeles", country: "United States", lat: 34.0522, lng: -118.2437, flag: "🇺🇸", hub: "Venice / WeHo" }
                      ].map(preset => {
                        const isSelected = selectedDestination?.city === preset.city || query.toLowerCase().includes(preset.city.toLowerCase());
                        return e.jsxs("button", {
                          key: preset.name,
                          type: "button",
                          onClick: () => {
                            o("medium");
                            const dest = {
                              displayLabel: preset.name + ", " + preset.country,
                              city: preset.city,
                              country: preset.country,
                              lat: preset.lat,
                              lng: preset.lng
                            };
                            setSelectedDestination(dest);
                            setQuery(preset.name + ", " + preset.country);
                            setSuggestions([]);
                            searchDest(preset.city);
                          },
                          className: "px-2.5 py-1.5 rounded-xl text-[11px] font-semibold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer " + (isSelected ? "bg-red-600 text-white shadow-sm shadow-red-600/30 border border-red-500" : "bg-zinc-100 dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800"),
                          children: [
                            e.jsx("span", { className: "text-xs", children: preset.flag }),
                            e.jsx("span", { className: "font-medium", children: preset.name }),
                            e.jsxs("span", { className: "text-[9px] opacity-60 hidden sm:inline", children: ["· ", preset.hub] })
                          ]
                        });
                      })
                    })
                  ]
                }),
                e.jsxs("div", {
                  className: "grid grid-cols-2 gap-3",
                  children: [
                    e.jsxs("div", {
                      className: "space-y-1.5",
                      children: [
                        e.jsx("label", { className: "text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block", children: "Arrival" }),
                        e.jsxs("div", {
                          className: "relative",
                          children: [
                            e.jsx(O, { className: "w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" }),
                            e.jsx("input", {
                              type: "date",
                              value: arrivalDate,
                              onChange: t => setArrivalDate(t.target.value),
                              className: "w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-500 dark:focus:border-zinc-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none transition-colors"
                            })
                          ]
                        })
                      ]
                    }),
                    e.jsxs("div", {
                      className: "space-y-1.5",
                      children: [
                        e.jsx("label", { className: "text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest block", children: "Departure" }),
                        e.jsxs("div", {
                          className: "relative",
                          children: [
                            e.jsx(O, { className: "w-4 h-4 text-zinc-400 dark:text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" }),
                            e.jsx("input", {
                              type: "date",
                              value: departureDate,
                              onChange: t => setDepartureDate(t.target.value),
                              className: "w-full bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200 dark:border-zinc-800 focus:border-red-500 dark:focus:border-zinc-500 rounded-xl pl-10 pr-3 py-2.5 text-xs text-zinc-800 dark:text-zinc-200 outline-none transition-colors"
                            })
                          ]
                        })
                      ]
                    })
                  ]
                }),
                e.jsxs("div", {
                  className: "space-y-1.5",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-center justify-between",
                      children: [
                        e.jsxs("label", {
                          className: "text-[10px] font-mono font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest flex items-center gap-1.5",
                          children: [e.jsx(U, { className: "w-3 h-3 text-zinc-400 dark:text-zinc-500" }), e.jsx("span", { children: "Corridor Radius" })]
                        }),
                        e.jsxs("span", { className: "text-[10px] font-mono font-bold text-red-500 dark:text-red-400", children: [radiusKm, " km"] })
                      ]
                    }),
                    e.jsx("div", {
                      className: "grid grid-cols-4 gap-1.5",
                      children: [{ label: "25 km", km: 25 }, { label: "50 km", km: 50 }, { label: "100 km", km: 100 }, { label: "250 km", km: 250 }].map(t => e.jsx("button", {
                        key: t.km,
                        type: "button",
                        onClick: () => {
                          setRadiusKm(t.km);
                          if (query.trim()) searchDest(query, t.km);
                        },
                        className: "py-1.5 rounded-lg text-[10px] font-semibold transition-all cursor-pointer " + (radiusKm === t.km ? "bg-zinc-800 dark:bg-zinc-800 text-white border border-zinc-700 shadow-sm" : "bg-zinc-100 dark:bg-zinc-900/60 text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800/80"),
                        children: t.label
                      }))
                    })
                  ]
                }),
                e.jsxs("div", {
                  className: "space-y-2 pt-1",
                  children: [
                    e.jsxs("button", {
                      type: "button",
                      onClick: handleActivateTravelMode,
                      className: "w-full py-3.5 rounded-xl bg-red-600 hover:bg-red-500 active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-md shadow-red-600/20",
                      children: [
                        e.jsx("span", { children: "✈" }),
                        e.jsx("span", {
                          children: !isSubscribed
                            ? "Unlock Travel Mode (Pro Pass)"
                            : (query.trim() ? "Activate Travel Mode (" + query.split(",")[0] + ")" : "Activate Travel Mode")
                        })
                      ]
                    }),
                    activeTravel?.is_travel_mode && e.jsx("button", {
                      type: "button",
                      onClick: handleResetToGPS,
                      className: "w-full py-2.5 rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800/80 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold text-xs transition-colors cursor-pointer text-center",
                      children: "Reset to Device GPS Coordinates"
                    })
                  ]
                })
              ]
            }),
            hasSearched && e.jsxs("div", {
              className: "space-y-3 pt-2",
              children: [
                e.jsxs("div", {
                  className: "flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs",
                  children: [
                    e.jsxs("button", {
                      type: "button",
                      onClick: () => setActiveTab("athletes"),
                      className: "flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 " + (activeTab === "athletes" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"),
                      children: [e.jsx(R, { className: "w-3.5 h-3.5" }), e.jsxs("span", { children: ["Athletes (", athletes.length, ")"] })]
                    }),
                    e.jsxs("button", {
                      type: "button",
                      onClick: () => setActiveTab("gyms"),
                      className: "flex-1 py-1.5 rounded-lg font-semibold transition-all cursor-pointer flex items-center justify-center gap-1.5 " + (activeTab === "gyms" ? "bg-white dark:bg-zinc-800 text-zinc-900 dark:text-white shadow-xs" : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"),
                      children: [e.jsx(G, { className: "w-3.5 h-3.5" }), e.jsxs("span", { children: ["Gyms (", gyms.length, ")"] })]
                    })
                  ]
                }),
                activeTab === "athletes" && e.jsx("div", {
                  className: "space-y-2",
                  children: athletes.length === 0 ? e.jsxs("div", {
                    className: "p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 text-center space-y-2.5",
                    children: [
                      e.jsxs("p", { className: "text-xs text-zinc-500 dark:text-zinc-400", children: ["No athletes indexed directly within ", radiusKm, " km of ", query || "this destination", "."] }),
                      radiusKm < 250 && e.jsxs("button", {
                        type: "button",
                        onClick: () => { setRadiusKm(250); searchDest(query, 250); },
                        className: "px-3.5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs active:scale-95 transition-all inline-flex items-center gap-1.5 shadow-sm cursor-pointer",
                        children: [e.jsx(U, { className: "w-3.5 h-3.5" }), e.jsx("span", { children: "Expand to 250 km Corridor" })]
                      })
                    ]
                  }) : athletes.map(t => {
                    const isSent = sentRequests.has(t.user.id);
                    return e.jsxs("div", {
                      className: "p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3",
                      children: [
                        e.jsxs("div", {
                          className: "flex items-center gap-3 min-w-0",
                          children: [
                            t.user.user_avatar ? e.jsx("img", { src: t.user.user_avatar, alt: t.user.user_name, className: "w-9 h-9 rounded-full object-cover border border-zinc-200 dark:border-zinc-800" }) : e.jsx("div", { className: "w-9 h-9 rounded-full bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center justify-center", children: (t.user.user_name?.[0]?.toUpperCase()) || "A" }),
                            e.jsxs("div", {
                              className: "min-w-0",
                              children: [
                                e.jsx("p", { className: "text-xs font-semibold text-zinc-900 dark:text-white truncate", children: t.user.user_name }),
                                e.jsx("p", { className: "text-[11px] text-zinc-500 dark:text-zinc-400 truncate", children: t.user.training_focus || t.user.favorite_gym || "Athlete" })
                              ]
                            })
                          ]
                        }),
                        e.jsx("div", {
                          children: isSent ? e.jsxs("span", {
                            className: "px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-emerald-600 dark:text-emerald-400 text-[11px] font-semibold flex items-center gap-1",
                            children: [e.jsx(ne, { className: "w-3 h-3" }), e.jsx("span", { children: "Sent" })]
                          }) : e.jsxs("button", {
                            type: "button",
                            onClick: () => handleSendConnection(t),
                            className: "px-3 py-1 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-white text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1",
                            children: [e.jsx(ie, { className: "w-3 h-3 text-zinc-500 dark:text-zinc-400" }), e.jsx("span", { children: "Connect" })]
                          })
                        })
                      ]
                    }, t.user.id);
                  })
                }),
                activeTab === "gyms" && e.jsx("div", {
                  className: "space-y-2",
                  children: gyms.length === 0 ? e.jsx("div", {
                    className: "p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-200 dark:border-zinc-800/80 text-center text-xs text-zinc-500 dark:text-zinc-400",
                    children: "No verified gym locations found."
                  }) : gyms.map(t => e.jsxs("div", {
                    className: "p-3 rounded-xl bg-zinc-50 dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-800/80 flex items-center justify-between gap-3",
                    children: [
                      e.jsxs("div", {
                        className: "min-w-0",
                        children: [
                          e.jsx("p", { className: "text-xs font-semibold text-zinc-900 dark:text-white truncate", children: t.name }),
                          e.jsxs("p", {
                            className: "text-[11px] text-zinc-500 dark:text-zinc-400 truncate flex items-center gap-1 mt-0.5",
                            children: [e.jsx(M, { className: "w-3 h-3 text-zinc-400 dark:text-zinc-500 shrink-0" }), e.jsx("span", { children: t.address })]
                          })
                        ]
                      }),
                      t.address && e.jsx("a", {
                        href: "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(t.name + " " + t.address),
                        target: "_blank",
                        rel: "noopener noreferrer",
                        className: "p-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer shrink-0",
                        title: "View on Google Maps",
                        children: e.jsx(ce, { className: "w-3.5 h-3.5" })
                      })
                    ]
                  }, t.id))
                })
              ]
            }),
            !isSubscribed && e.jsxs("div", {
              className: "p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/90 border border-zinc-200/80 dark:border-zinc-800/90 space-y-4",
              children: [
                e.jsxs("div", {
                  className: "space-y-1.5",
                  children: [
                    e.jsxs("div", {
                      className: "flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200",
                      children: [e.jsx(le, { className: "w-4 h-4 text-zinc-500 dark:text-zinc-400" }), e.jsx("h4", { className: "text-xs sm:text-sm font-semibold", children: "Upgrade to Premium to message athletes before landing." })]
                    }),
                    e.jsx("p", {
                      className: "text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed",
                      children: "Search for gyms and athletes at your destination. Unlock day passes, buddy matching, and direct messaging."
                    })
                  ]
                }),
                e.jsxs("div", {
                  className: "flex items-center gap-2 flex-wrap text-[11px]",
                  children: [
                    e.jsxs("span", {
                      className: "px-2.5 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800/90 border border-zinc-300/80 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5",
                      children: [e.jsx(R, { className: "w-3 h-3 text-zinc-500 dark:text-zinc-400" }), e.jsx("span", { children: "Buddy Matching" })]
                    }),
                    e.jsxs("span", {
                      className: "px-2.5 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800/90 border border-zinc-300/80 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5",
                      children: [e.jsx(G, { className: "w-3 h-3 text-zinc-500 dark:text-zinc-400" }), e.jsx("span", { children: "Gym Finding" })]
                    }),
                    e.jsxs("span", {
                      className: "px-2.5 py-1 rounded-full bg-zinc-200/70 dark:bg-zinc-800/90 border border-zinc-300/80 dark:border-zinc-700/60 text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5",
                      children: [e.jsx(de, { className: "w-3 h-3 text-zinc-500 dark:text-zinc-400" }), e.jsx("span", { children: "Verified Profiles" })]
                    })
                  ]
                }),
                e.jsxs("button", {
                  type: "button",
                  onClick: () => {
                    o("medium");
                    p();
                    v?.("premium_travel");
                  },
                  className: "w-full py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 dark:bg-[#607368] dark:hover:bg-[#6e8377] active:scale-[0.99] text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer",
                  children: [e.jsx("span", { children: "Unlock Travel Mode" }), e.jsx(oe, { className: "w-4 h-4" })]
                }),
                e.jsx("div", {
                  className: "text-center",
                  children: e.jsx("span", { className: "text-[11px] font-mono text-zinc-500 dark:text-zinc-400", children: "Premium Travel • $15.99/mo" })
                }),
                e.jsxs("div", {
                  className: "flex items-center gap-2 pt-1",
                  children: [
                    e.jsx("input", {
                      type: "text",
                      value: promoCode,
                      onChange: t => { setPromoCode(t.target.value.toUpperCase()); setPromoNotice(null); },
                      placeholder: "PROMO CODE",
                      className: "flex-1 bg-white dark:bg-black/60 border border-zinc-300 dark:border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-mono text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-600 outline-none uppercase"
                    }),
                    e.jsx("button", {
                      type: "button",
                      onClick: handleApplyPromo,
                      className: "px-4 py-2.5 rounded-xl bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-xs font-semibold text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer",
                      children: "Apply"
                    })
                  ]
                }),
                promoNotice && e.jsx("p", {
                  className: "text-[11px] font-mono text-center " + (promoNotice.type === "success" ? "text-emerald-500 dark:text-emerald-400" : "text-zinc-500 dark:text-zinc-400"),
                  children: promoNotice.text
                })
              ]
            })
          ]
        })
      ]
    })
  });
};

export { TravelPassModal };
`;

console.log('Validating TravelPassModal with esbuild...');
esbuild.transformSync(travelModalCode, { loader: 'js' });
console.log('TravelPassModal syntax is 100% valid!');

const targetPath = 'assets/TravelPassModal-Bgu4TdMZ-CcSltve7-BdL4ZAf_.js';
const distTargetPath = 'dist/assets/TravelPassModal-Bgu4TdMZ-CcSltve7-BdL4ZAf_.js';

fs.writeFileSync(targetPath, travelModalCode, 'utf8');
console.log('Written to', targetPath);

if (fs.existsSync('dist/assets')) {
  fs.writeFileSync(distTargetPath, travelModalCode, 'utf8');
  console.log('Written to', distTargetPath);
}
