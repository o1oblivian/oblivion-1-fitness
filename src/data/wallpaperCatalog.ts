/**
 * Curated OLED wallpaper catalog — Unsplash CDN, landscape-safe crops.
 *
 * Every photo ID below was checked live (HTTP 200, image/jpeg) at the delivery size
 * used in the app (w=1200&q=80). IDs are unique across the whole catalog.
 * The UI also self-heals: any image that fails to load at runtime is dropped from the
 * active rotation (see useWallpaperStore.reportBroken), so a broken-image icon never shows.
 */

export type WallpaperCategory = 'iron' | 'hyrox' | 'track' | 'combat' | 'nature';

export interface CatalogWallpaper {
  id: string;
  category: WallpaperCategory;
  title: string;
  url: string;
  thumbUrl: string;
}

export const WALLPAPER_CATEGORY_LABELS: Record<WallpaperCategory, string> = {
  iron: 'Olympia & Heavy Iron',
  hyrox: 'Hyrox & Functional',
  track: 'Track & Sprint',
  combat: 'Combat & Boxing',
  nature: 'Dark Nature',
};

const base = (photo: string, width: number, quality: number) =>
  `https://images.unsplash.com/photo-${photo}?auto=format&fit=crop&w=${width}&q=${quality}`;

function w(category: WallpaperCategory, id: string, photo: string, title: string): CatalogWallpaper {
  return {
    id: `wp-${id}`,
    category,
    title,
    url: base(photo, 1200, 80),
    thumbUrl: base(photo, 360, 70),
  };
}

export const WALLPAPER_CATALOG: CatalogWallpaper[] = [
  w('iron', 'iron-01', '1581009146145-b5ef050c2e1e', 'Barbell curl'),
  w('iron', 'iron-02', '1517963879433-6ad2b056d712', 'Barbell setup'),
  w('iron', 'iron-03', '1534438327276-14e5300c3a48', 'Dumbbell rack'),
  w('iron', 'iron-04', '1541534741688-6078c6bfb5c5', 'Rack pull-up'),
  w('iron', 'iron-05', '1574680096145-d05b474e2155', 'Back under the bar'),
  w('iron', 'iron-06', '1583454110551-21f2fa2afe61', 'Hook grip'),
  w('iron', 'iron-07', '1434682881908-b43d0467b798', 'Dark back detail'),
  w('iron', 'iron-08', '1517964603305-11c0f6f66012', 'Plates on the bar'),
  w('iron', 'iron-09', '1517838277536-f5f99be501cd', 'Barbell pull'),
  w('iron', 'iron-10', '1526506118085-60ce8714f8c5', 'Overhead hold'),
  w('iron', 'iron-11', '1517836357463-d25dfeac3438', 'Deadlift lockout'),
  w('iron', 'iron-12', '1549060279-7e168fcee0c2', 'Chalk and laces'),
  w('iron', 'iron-13', '1521804906057-1df8fdb718b7', 'Heavy pull'),
  w('iron', 'iron-14', '1526401485004-46910ecc8e51', 'Competition plates'),
  w('iron', 'iron-15', '1574680178050-55c6a6a96e0a', 'Squat rack'),
  w('iron', 'iron-16', '1550345332-09e3ac987658', 'Iron room'),
  w('iron', 'iron-17', '1605296867304-46d5465a13f1', 'Dark lifter'),
  w('iron', 'iron-18', '1532029837206-abbe2b7620e3', 'Power rack'),
  w('iron', 'iron-19', '1581009137042-c552e485697a', 'Cable station'),
  w('iron', 'iron-20', '1549476464-37392f717541', 'Late session'),
  w('iron', 'iron-21', '1534367610401-9f5ed68180aa', 'Bar on traps'),
  w('iron', 'iron-22', '1546483875-ad9014c88eba', 'Row machine'),
  w('iron', 'iron-23', '1603287681836-b174ce5074c2', 'Back double'),
  w('iron', 'iron-24', '1541600383005-565c949cf777', 'Squat plates'),
  w('iron', 'iron-25', '1595078475328-1ab05d0a6a0e', 'Plate load'),
  w('iron', 'iron-26', '1554284126-aa88f22d8b74', 'Bench in mono'),
  w('iron', 'iron-27', '1517836477839-7072aaa8b121', 'Hip hinge'),
  w('iron', 'iron-28', '1517344368193-41552b6ad3f5', 'Barbell in mono'),
  w('iron', 'iron-29', '1605296867424-35fc25c9212a', 'Pull-up bar'),
  w('iron', 'iron-30', '1556817411-31ae72fa3ea0', 'Deadlift mats'),
  w('iron', 'iron-31', '1556817411-58c45dd94e8c', 'Deadlift in the dark'),
  w('hyrox', 'hyrox-01', '1566241142559-40e1dab266c6', 'Floor push-up'),
  w('hyrox', 'hyrox-02', '1567013127542-490d757e51fc', 'Rope station'),
  w('hyrox', 'hyrox-03', '1599058917212-d750089bc07e', 'Battle ropes'),
  w('hyrox', 'hyrox-04', '1579758629938-03607ccdbaba', 'Rest between sets'),
  w('hyrox', 'hyrox-05', '1590487988256-9ed24133863e', 'Training rig'),
  w('hyrox', 'hyrox-06', '1534258936925-c58bed479fcb', 'Rope waves'),
  w('hyrox', 'hyrox-07', '1533681904393-9ab6eee7e408', 'Sled push'),
  w('hyrox', 'hyrox-08', '1522898467493-49726bf28798', 'Stability work'),
  w('hyrox', 'hyrox-09', '1598971639058-fab3c3109a00', 'Push-up drive'),
  w('hyrox', 'hyrox-10', '1594737625785-a6cbdabd333c', 'Dumbbell push-ups'),
  w('hyrox', 'hyrox-11', '1581122584612-713f89daa8eb', 'Bosu balance'),
  w('hyrox', 'hyrox-12', '1599058917765-a780eda07a3e', 'Functional floor'),
  w('hyrox', 'hyrox-13', '1623874228601-f4193c7b1818', 'Plyo box'),
  w('hyrox', 'hyrox-14', '1616279969856-759f316a5ac1', 'TRX flow'),
  w('hyrox', 'hyrox-15', '1620188467120-5042ed1eb5da', 'Open gym floor'),
  w('hyrox', 'hyrox-16', '1623874514711-0f321325f318', 'Warehouse gym'),
  w('hyrox', 'hyrox-17', '1571902943202-507ec2618e8f', 'Empty floor'),
  w('hyrox', 'hyrox-18', '1601422407692-ec4eeec1d9b3', 'Kettlebell snatch'),
  w('hyrox', 'hyrox-19', '1550259979-ed79b48d2a30', 'Kettlebell session'),
  w('hyrox', 'hyrox-20', '1434596922112-19c563067271', 'Rope slam'),
  w('hyrox', 'hyrox-21', '1535743686920-55e4145369b9', 'Battle rope'),
  w('hyrox', 'hyrox-22', '1597452485669-2c7bb5fef90d', 'Cable pull'),
  w('hyrox', 'hyrox-23', '1547919307-1ecb10702e6f', 'Tyres and plates'),
  w('hyrox', 'hyrox-24', '1519311965067-36d3e5f33d39', 'Mat circuit'),
  w('hyrox', 'hyrox-25', '1604480133435-25b86862d276', 'Cable run'),
  w('track', 'track-01', '1552674605-db6ffd4facb5', 'Sunrise runners'),
  w('track', 'track-02', '1538805060514-97d9cc17730c', 'Stair repeats'),
  w('track', 'track-03', '1476480862126-209bfaa8edc8', 'Stairs climb'),
  w('track', 'track-04', '1461896836934-ffe607ba8211', 'Starting blocks'),
  w('track', 'track-05', '1502904550040-7534597429ae', 'Track from above'),
  w('track', 'track-06', '1486218119243-13883505764c', 'Open road run'),
  w('track', 'track-07', '1530143311094-34d807799e8f', 'Ridge run'),
  w('track', 'track-08', '1571008887538-b36bb32f4571', 'Sprint stride'),
  w('track', 'track-09', '1483721310020-03333e577078', 'Lace up'),
  w('track', 'track-10', '1607962837359-5e7e89f86776', 'City run'),
  w('track', 'track-11', '1486739985386-d4fae04ca6f7', 'Trail pace'),
  w('track', 'track-12', '1594882645126-14020914d58d', 'Dusk silhouette'),
  w('track', 'track-13', '1547941126-3d5322b218b0', 'Block start'),
  w('combat', 'combat-01', '1517344884509-a0c97ec11bcc', 'Wrapped hands'),
  w('combat', 'combat-02', '1549719386-74dfcbf7dbed', 'Gloves down'),
  w('combat', 'combat-03', '1517438322307-e67111335449', 'Pad work'),
  w('combat', 'combat-04', '1571731956672-f2b94d7dd0cb', 'Heavy bag'),
  w('combat', 'combat-05', '1509563268479-0f004cf3f58b', 'Ring lights'),
  w('combat', 'combat-06', '1583473848882-f9a5bc7fd2ee', 'Gloves on the floor'),
  w('combat', 'combat-07', '1591117207239-788bf8de6c3b', 'Boxing in mono'),
  w('combat', 'combat-08', '1552072092-7f9b8d63efcb', 'Walk to the ring'),
  w('nature', 'nature-01', '1448375240586-882707db888b', 'Fog pines'),
  w('nature', 'nature-02', '1473448912268-2022ce9509d8', 'Lake and pines'),
  w('nature', 'nature-03', '1531366936337-7c912a4589a7', 'Aurora ridge'),
  w('nature', 'nature-04', '1483728642387-6c3bdd6c93e5', 'Mountain dusk'),
  w('nature', 'nature-05', '1426604966848-d7adac402bff', 'Granite wall'),
  w('nature', 'nature-06', '1519681393784-d120267933ba', 'Night peaks'),
  w('nature', 'nature-07', '1465056836041-7f43ac27dcb5', 'Alpine horizon'),
  w('nature', 'nature-08', '1483921020237-2ff51e8e4b22', 'Glacier ridge'),
  w('nature', 'nature-09', '1517411032315-54ef2cb783bb', 'Green aurora'),
  w('nature', 'nature-10', '1469474968028-56623f02e42e', 'Crag light'),
  w('nature', 'nature-11', '1465188162913-8fb5709d6d57', 'Ridge trail'),
  w('nature', 'nature-12', '1473773508845-188df298d2d1', 'Pine canopy'),
  w('nature', 'nature-13', '1486870591958-9b9d0d1dda99', 'Snow peak'),
  w('nature', 'nature-14', '1492691527719-9d1e07e534b4', 'Summit mist'),
  w('nature', 'nature-15', '1470770841072-f978cf4d019e', 'Cloud valley'),
  w('nature', 'nature-16', '1508739773434-c26b3d09e071', 'Red ridge'),
  w('nature', 'nature-17', '1518241353330-0f7941c2d9b5', 'Light on the water'),
  w('nature', 'nature-18', '1484591974057-265bb767ef71', 'Plateau dusk'),
  w('nature', 'nature-19', '1464278533981-50106e6176b1', 'Mirror lake'),
  w('nature', 'nature-20', '1519904981063-b0cf448d479e', 'Cloud summit'),
  w('nature', 'nature-21', '1506905925346-21bda4d32df4', 'Sea of clouds'),
  w('nature', 'nature-22', '1431794062232-2a99a5431c6c', 'Canyon waterfall'),
  w('nature', 'nature-23', '1500534314209-a25ddb2bd429', 'Hazy layers'),
  w('nature', 'nature-24', '1418065460487-3e41a6c84dc5', 'Mist forest'),
  w('nature', 'nature-25', '1491466424936-e304919aada7', 'Ice cave'),
  w('nature', 'nature-26', '1439853949127-fa647821eba0', 'Alpine lake'),
  w('nature', 'nature-27', '1517824806704-9040b037703b', 'Milky way camp'),
  w('nature', 'nature-28', '1533130061792-64b345e4a833', 'Everest light'),
  w('nature', 'nature-29', '1470252649378-9c29740c9fa8', 'Evening meadow'),
  w('nature', 'nature-30', '1477346611705-65d1883cee1e', 'Dark crags'),
];

export const WALLPAPER_COUNTS: Record<WallpaperCategory, number> = WALLPAPER_CATALOG.reduce(
  (acc, item) => {
    acc[item.category] += 1;
    return acc;
  },
  { iron: 0, hyrox: 0, track: 0, combat: 0, nature: 0 } as Record<WallpaperCategory, number>,
);
