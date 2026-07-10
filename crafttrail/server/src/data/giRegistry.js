/**
 * GI (Geographical Indication) reference registry.
 *
 * This is the substrate for the Tier-1 cross-check: an artisan claiming
 * "Pochampally Ikat" must be located in a district where that GI is actually
 * registered. A forged certificate from the wrong district fails here with
 * zero human effort.
 *
 * Sourced from the GI Registry (Chennai) handicraft/textile classes.
 * `aliases` exist because OCR output and human typing are both messy.
 * `significance` (1-10) feeds the discovery ranking, not the trust score.
 */

export const GI_REGISTRY = [
  {
    gi: 'Pochampally Ikat',
    aliases: ['pochampally', 'pochampally ikkat', 'ikat pochampally'],
    craft: 'Handloom Ikat Weaving',
    districts: ['Yadadri Bhuvanagiri', 'Nalgonda'],
    state: 'Telangana',
    significance: 9,
  },
  {
    gi: 'Bagru Hand Block Print',
    aliases: ['bagru', 'bagru block print', 'bagru print'],
    craft: 'Natural-Dye Block Printing',
    districts: ['Jaipur'],
    state: 'Rajasthan',
    significance: 9,
  },
  {
    gi: 'Sanganeri Hand Block Print',
    aliases: ['sanganeri', 'sanganer print', 'sanganer block print'],
    craft: 'Hand Block Printing',
    districts: ['Jaipur'],
    state: 'Rajasthan',
    significance: 8,
  },
  {
    gi: 'Blue Pottery of Jaipur',
    aliases: ['blue pottery', 'jaipur blue pottery'],
    craft: 'Quartz Blue Pottery',
    districts: ['Jaipur'],
    state: 'Rajasthan',
    significance: 8,
  },
  {
    gi: 'Odisha Pattachitra',
    aliases: ['pattachitra', 'patachitra', 'orissa pattachitra'],
    craft: 'Scroll Painting',
    districts: ['Puri'],
    state: 'Odisha',
    significance: 10,
  },
  {
    gi: 'Kondapalli Bommallu',
    aliases: ['kondapalli', 'kondapalli toys', 'kondapalli bommalu'],
    craft: 'Softwood Toy Carving',
    districts: ['NTR', 'Krishna'],
    state: 'Andhra Pradesh',
    significance: 8,
  },
  {
    gi: 'Etikoppaka Toys',
    aliases: ['etikoppaka', 'etikoppaka bommalu'],
    craft: 'Lacquer Turned Wood Toys',
    districts: ['Anakapalli', 'Visakhapatnam'],
    state: 'Andhra Pradesh',
    significance: 7,
  },
  {
    gi: 'Srikalahasti Kalamkari',
    aliases: ['kalamkari', 'srikalahasti', 'kalamkari srikalahasti'],
    craft: 'Freehand Pen Kalamkari',
    districts: ['Tirupati', 'Chittoor'],
    state: 'Andhra Pradesh',
    significance: 9,
  },
  {
    gi: 'Channapatna Toys and Dolls',
    aliases: ['channapatna', 'channapatna toys'],
    craft: 'Lacquerware Toys',
    districts: ['Ramanagara'],
    state: 'Karnataka',
    significance: 8,
  },
  {
    gi: 'Bidriware',
    aliases: ['bidri', 'bidriware', 'bidar metal'],
    craft: 'Zinc-Copper Silver Inlay',
    districts: ['Bidar'],
    state: 'Karnataka',
    significance: 9,
  },
  {
    gi: 'Mysore Silk',
    aliases: ['mysore silk', 'mysuru silk'],
    craft: 'Silk Weaving',
    districts: ['Mysuru'],
    state: 'Karnataka',
    significance: 8,
  },
  {
    gi: 'Madhubani Paintings',
    aliases: ['madhubani', 'mithila painting', 'mithila'],
    craft: 'Mithila Folk Painting',
    districts: ['Madhubani', 'Darbhanga'],
    state: 'Bihar',
    significance: 10,
  },
  {
    gi: 'Bhagalpur Silk',
    aliases: ['bhagalpur silk', 'tussar bhagalpur'],
    craft: 'Tussar Silk Weaving',
    districts: ['Bhagalpur'],
    state: 'Bihar',
    significance: 7,
  },
  {
    gi: 'Kancheepuram Silk',
    aliases: ['kanchipuram silk', 'kanchipuram', 'kancheepuram'],
    craft: 'Mulberry Silk Saree Weaving',
    districts: ['Kanchipuram'],
    state: 'Tamil Nadu',
    significance: 9,
  },
  {
    gi: 'Thanjavur Paintings',
    aliases: ['thanjavur painting', 'tanjore painting', 'tanjore'],
    craft: 'Gold-Foil Panel Painting',
    districts: ['Thanjavur'],
    state: 'Tamil Nadu',
    significance: 8,
  },
  {
    gi: 'Banaras Brocades and Sarees',
    aliases: ['banarasi', 'banarasi saree', 'benaras brocade', 'varanasi silk'],
    craft: 'Brocade Silk Weaving',
    districts: ['Varanasi'],
    state: 'Uttar Pradesh',
    significance: 10,
  },
  {
    gi: 'Moradabad Metal Craft',
    aliases: ['moradabad brass', 'moradabad metal'],
    craft: 'Brass Metalware',
    districts: ['Moradabad'],
    state: 'Uttar Pradesh',
    significance: 7,
  },
  {
    gi: 'Firozabad Glass',
    aliases: ['firozabad glass', 'firozabad bangles'],
    craft: 'Hand-Blown Glasswork',
    districts: ['Firozabad'],
    state: 'Uttar Pradesh',
    significance: 6,
  },
  {
    gi: 'Chanderi Fabric',
    aliases: ['chanderi', 'chanderi saree'],
    craft: 'Sheer Handloom Weaving',
    districts: ['Ashoknagar'],
    state: 'Madhya Pradesh',
    significance: 8,
  },
  {
    gi: 'Maheshwar Sarees and Fabrics',
    aliases: ['maheshwari', 'maheshwar saree', 'maheshwari saree'],
    craft: 'Maheshwari Handloom',
    districts: ['Khargone'],
    state: 'Madhya Pradesh',
    significance: 8,
  },
  {
    gi: 'Bastar Dhokra',
    aliases: ['dhokra', 'dokra', 'bastar dhokra', 'bell metal'],
    craft: 'Lost-Wax Bell Metal Casting',
    districts: ['Bastar'],
    state: 'Chhattisgarh',
    significance: 9,
  },
  {
    gi: 'Kutch Embroidery',
    aliases: ['kutch embroidery', 'kachchh embroidery', 'kutch'],
    craft: 'Mirror-Work Embroidery',
    districts: ['Kachchh'],
    state: 'Gujarat',
    significance: 9,
  },
  {
    gi: 'Warli Painting',
    aliases: ['warli', 'warli art'],
    craft: 'Tribal Wall Painting',
    districts: ['Palghar', 'Thane'],
    state: 'Maharashtra',
    significance: 8,
  },
  {
    gi: 'Paithani Sarees and Fabrics',
    aliases: ['paithani', 'paithani saree'],
    craft: 'Zari Border Silk Weaving',
    districts: ['Chhatrapati Sambhajinagar', 'Aurangabad'],
    state: 'Maharashtra',
    significance: 8,
  },
  {
    gi: 'Kullu Shawl',
    aliases: ['kullu shawl', 'kullu'],
    craft: 'Geometric Wool Shawl Weaving',
    districts: ['Kullu'],
    state: 'Himachal Pradesh',
    significance: 7,
  },
  {
    gi: 'Kashmir Pashmina',
    aliases: ['pashmina', 'kashmiri pashmina'],
    craft: 'Hand-Spun Pashmina Weaving',
    districts: ['Srinagar'],
    state: 'Jammu and Kashmir',
    significance: 10,
  },
  {
    gi: 'Aranmula Kannadi',
    aliases: ['aranmula', 'aranmula mirror', 'metal mirror'],
    craft: 'Alloy Metal Mirror',
    districts: ['Pathanamthitta'],
    state: 'Kerala',
    significance: 9,
  },
  {
    gi: 'Nirmal Toys and Craft',
    aliases: ['nirmal toys', 'nirmal painting', 'nirmal'],
    craft: 'Poniki Wood Toys & Painting',
    districts: ['Nirmal'],
    state: 'Telangana',
    significance: 7,
  },
];

const norm = (s = '') => s.toLowerCase().replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();

/** Fuzzy-ish lookup tolerant of OCR noise. Returns the registry entry or null. */
export function findGi(claim) {
  if (!claim) return null;
  const n = norm(claim);
  if (!n) return null;

  // exact / alias match first
  for (const e of GI_REGISTRY) {
    if (norm(e.gi) === n) return e;
    if (e.aliases.some((a) => norm(a) === n)) return e;
  }
  // substring containment (OCR often bolts on extra words)
  for (const e of GI_REGISTRY) {
    if (n.includes(norm(e.gi)) || norm(e.gi).includes(n)) return e;
    if (e.aliases.some((a) => n.includes(norm(a)))) return e;
  }
  return null;
}

/** Does the claimed GI belong to the district the artisan says they work in? */
export function giMatchesDistrict(giEntry, district, state) {
  if (!giEntry) return { match: false, reason: 'GI not found in registry' };
  const d = norm(district);
  const s = norm(state);
  const districtOk = giEntry.districts.some((x) => norm(x) === d);
  const stateOk = norm(giEntry.state) === s;

  if (districtOk && stateOk) return { match: true, reason: 'District and state match GI registry' };
  if (stateOk) {
    return {
      match: false,
      reason: `State matches but "${district}" is not a registered district for ${giEntry.gi}`,
    };
  }
  return {
    match: false,
    reason: `${giEntry.gi} is registered to ${giEntry.state}, not ${state || 'unknown'}`,
  };
}
