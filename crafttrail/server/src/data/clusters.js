/**
 * One cluster per GI registry entry.
 *
 * Every entry here is keyed to a `gi` value in giRegistry.js. That coupling is
 * deliberate: a cluster without a registered GI has nothing for Tier 1 to check
 * against, and an artisan generated into it could never be verified.
 *
 * Coordinates are real. Do not round them — the Jaipur→Bagru demo only works
 * because Bagru is genuinely ~30 km out.
 */
export const CLUSTER_SEED = [
  // Rajasthan
  { gi: 'Bagru Hand Block Print', name: 'Bagru', coordinates: [75.545, 26.8125],
    heritageNote: 'Block printing has been practised here for roughly 300 years, using fermented iron dye (syahi) and pomegranate-rind yellows rather than chemical colour.',
    description: 'A working printing village 30 km from Jaipur, where the Chhipa community still washes cloth in the Sanjaria river bed before dyeing.' },
  { gi: 'Sanganeri Hand Block Print', name: 'Sanganer', coordinates: [75.7906, 26.8194],
    heritageNote: "Known for fine floral butis printed on a white ground, the mirror image of Bagru's dark-ground style.",
    description: "A block-printing and handmade-paper cluster on Jaipur's southern edge." },
  { gi: 'Blue Pottery of Jaipur', name: 'Jaipur Blue Pottery Quarter', coordinates: [75.8235, 26.8981],
    heritageNote: "The only pottery in India made without clay — quartz, glass frit and fuller's earth, fired once.",
    description: 'Workshops around Amer Road where Turko-Persian glaze technique survives.' },

  // Odisha
  { gi: 'Odisha Pattachitra', name: 'Raghurajpur', coordinates: [85.84, 19.9075],
    heritageNote: "India's first designated heritage craft village. Every one of its ~120 houses is a working studio.",
    description: 'A single street of painted verandas near Puri, where cotton canvas is stiffened with tamarind seed glue.' },

  // Telangana
  { gi: 'Pochampally Ikat', name: 'Bhoodan Pochampally', coordinates: [78.8167, 17.35],
    heritageNote: 'Yarn is tie-dyed before it is ever woven, so the pattern exists in the thread rather than on the cloth.',
    description: 'A UN-recognised best tourism village, 50 km from Hyderabad, with over 5,000 looms.' },
  { gi: 'Nirmal Toys and Craft', name: 'Nirmal', coordinates: [78.3428, 19.0968],
    heritageNote: 'Finished with a golden lacquer made from the gum of the tumma tree.',
    description: 'Toy and panel-painting workshops in northern Telangana.' },

  // Andhra Pradesh
  { gi: 'Kondapalli Bommallu', name: 'Kondapalli', coordinates: [80.5386, 16.6194],
    heritageNote: 'Carved from tella poniki, a wood so light the finished toys are nearly weightless.',
    description: 'Toy-making lanes below Kondapalli fort, near Vijayawada.' },
  { gi: 'Etikoppaka Toys', name: 'Etikoppaka', coordinates: [82.7386, 17.4986],
    heritageNote: 'Turned on a hand lathe and coloured with seed, bark and root dyes — safe enough for infants.',
    description: 'Lacquer-turnery households on the banks of the Varaha river.' },
  { gi: 'Srikalahasti Kalamkari', name: 'Srikalahasti', coordinates: [79.7, 13.75],
    heritageNote: 'Drawn entirely freehand with a bamboo kalam, never block-printed — the distinction that separates it from Machilipatnam.',
    description: 'Temple-town workshops where narrative cloth is still made for religious use.' },

  // Karnataka
  { gi: 'Channapatna Toys and Dolls', name: 'Channapatna', coordinates: [77.2065, 12.6514],
    heritageNote: 'Coloured with vegetable dyes and polished with a screwpine leaf; safe enough for infants to chew.',
    description: '"Toy town" on the Bengaluru–Mysuru highway, 60 km from Bengaluru.' },
  { gi: 'Bidriware', name: 'Bidar', coordinates: [77.5199, 17.9104],
    heritageNote: 'Blackened using soil taken from inside Bidar Fort, which is uniquely free of sunlight and nitrates.',
    description: 'Silver-inlay metalwork studios in the old city.' },
  { gi: 'Mysore Silk', name: 'Mysuru Silk Quarter', coordinates: [76.6394, 12.2958],
    heritageNote: 'Woven with pure mulberry silk and real gold zari, on looms the state has run since 1912.',
    description: 'Weaving sheds clustered around the old Government Silk Factory.' },

  // Bihar
  { gi: 'Madhubani Paintings', name: 'Madhubani', coordinates: [86.071, 26.3549],
    heritageNote: 'Painted by women on the mud walls of the home for centuries before it ever reached paper.',
    description: 'Village studios across the Madhubani district.' },
  { gi: 'Bhagalpur Silk', name: 'Bhagalpur', coordinates: [86.9842, 25.2425],
    heritageNote: 'Tussar silk reeled from cocoons the moth has already left — the reason it is called ahimsa silk.',
    description: 'Reeling and weaving households along the Ganga.' },

  // Tamil Nadu
  { gi: 'Kancheepuram Silk', name: 'Kanchipuram', coordinates: [79.7036, 12.8342],
    heritageNote: 'Body and border are woven separately and then interlocked, so the join survives the saree.',
    description: 'Temple-town weaving streets, 70 km from Chennai.' },
  { gi: 'Thanjavur Paintings', name: 'Thanjavur', coordinates: [79.1378, 10.787],
    heritageNote: 'Built up in gesso relief, then laid with 22-carat gold foil that never tarnishes.',
    description: 'Panel-painting studios near the Brihadeeswarar temple.' },

  // Uttar Pradesh
  { gi: 'Banaras Brocades and Sarees', name: 'Varanasi Weaving Quarter', coordinates: [82.9739, 25.3176],
    heritageNote: 'A single heavy brocade saree can take two weavers six months on a pit loom.',
    description: 'Pit-loom households in Madanpura and Alaipura.' },
  { gi: 'Moradabad Metal Craft', name: 'Moradabad', coordinates: [78.7733, 28.8386],
    heritageNote: 'Brass is beaten, engraved and electroplated in workshops that supply half the world\'s decorative metalware.',
    description: 'The "Peetal Nagri" — brass city — of western Uttar Pradesh.' },
  { gi: 'Firozabad Glass', name: 'Firozabad', coordinates: [78.3957, 27.1592],
    heritageNote: 'Bangles are drawn from a molten gob by hand and joined over a kerosene flame.',
    description: 'Furnace lanes producing most of India\'s glass bangles.' },

  // Madhya Pradesh
  { gi: 'Chanderi Fabric', name: 'Chanderi', coordinates: [78.1386, 24.7136],
    heritageNote: 'The yarn is never degummed, which is why the cloth stays sheer enough to read through.',
    description: 'Handloom sheds inside the walled town below Chanderi fort.' },
  { gi: 'Maheshwar Sarees and Fabrics', name: 'Maheshwar', coordinates: [75.5878, 22.1761],
    heritageNote: 'The saree borders copy motifs carved into the walls of the riverside fort above the looms.',
    description: 'Weaving sheds on the Narmada ghats.' },

  // Chhattisgarh
  { gi: 'Bastar Dhokra', name: 'Bastar (Jagdalpur)', coordinates: [82.0037, 19.0748],
    heritageNote: 'A 4,000-year-old lost-wax technique; the mould is destroyed to release the casting, so no two pieces exist twice.',
    description: 'Ghadwa artisan hamlets around Jagdalpur.' },

  // Gujarat
  { gi: 'Kutch Embroidery', name: 'Bhuj (Kutch)', coordinates: [69.6669, 23.2419],
    heritageNote: 'Sixteen distinct stitch traditions belonging to different communities, each legible as a signature.',
    description: 'Embroidery villages ringing Bhuj across the Banni grasslands.' },

  // Maharashtra
  { gi: 'Warli Painting', name: 'Ganjad (Palghar)', coordinates: [72.765, 19.697],
    heritageNote: 'Only white rice paste on a red earth wall. Circle, triangle, square — nothing else is needed.',
    description: 'Warli hamlets in the Dahanu belt north of Mumbai.' },
  { gi: 'Paithani Sarees and Fabrics', name: 'Paithan', coordinates: [75.3862, 19.4783],
    heritageNote: 'The pallu is woven by tapestry technique, thread by thread, without a shuttle crossing the full width.',
    description: 'Weaving households on the Godavari, south of Chhatrapati Sambhajinagar.' },

  // Himachal Pradesh
  { gi: 'Kullu Shawl', name: 'Kullu', coordinates: [77.1092, 31.9578],
    heritageNote: 'The geometric border patterns arrived with Bushahri weavers in the 1940s and never left.',
    description: 'Cooperative weaving sheds along the Beas valley.' },

  // Jammu and Kashmir
  { gi: 'Kashmir Pashmina', name: 'Srinagar', coordinates: [74.7973, 34.0837],
    heritageNote: 'Spun on a wooden yinder from the winter undercoat of the Changthangi goat, at 12 microns.',
    description: 'Spinning and weaving households in the old city.' },

  // Kerala
  { gi: 'Aranmula Kannadi', name: 'Aranmula', coordinates: [76.6811, 9.3186],
    heritageNote: 'A mirror made of polished alloy, not glass — so the reflection has no depth behind it.',
    description: 'A handful of families near the Parthasarathy temple who still know the alloy.' },
];
