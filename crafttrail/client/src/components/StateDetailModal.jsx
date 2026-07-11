import { useEffect, useRef } from 'react';
import { InlineChatbot } from './BotpressChatbot.jsx';
import './StateDetailModal.css';

/* ── Rich heritage data for all 16 states ─────────────────────────── */
const STATE_DATA = {
  telangana: {
    name: 'Telangana',
    tagline: 'The Ikat Heartland of Deccan',
    emoji: '🧵',
    color: '#c0492e',
    culture: `Telangana's cultural heritage is a magnificent tapestry woven from Deccan Sultanate, Nizam, and ancient Telugu traditions. The state is home to the mesmerising Kuchipudi and Perini Shivatandavam classical dance forms, the soulful Lavani folk songs, and the vibrant Bonalu festival dedicated to Goddess Mahakali. The Telangana Bathukamma festival — where women float floral arrangements on water — is one of India's most visually stunning celebrations.`,
    crafts: [
      { name: 'Pochampally Ikat', desc: 'Every thread is resist-dyed before weaving, creating intricate geometric patterns that appear to shimmer.', gi: true },
      { name: 'Gadwal Sarees', desc: 'Lightweight cotton bodies with pure silk borders and zari pallu — famous across South India.', gi: true },
      { name: 'Nirmal Paintings', desc: 'Lacquered wooden panels painted with natural colours depicting mythological stories.', gi: true },
      { name: 'Bidri Work', desc: 'Zinc and copper alloy inlaid with pure silver — a 14th-century craft from Bidar.', gi: true },
      { name: 'Pembarthi Metal Craft', desc: 'Gold-plated brass repousse work for temple decorations and showpieces.', gi: false },
    ],
    products: ['Pochampally Ikat sarees & dress materials', 'Gadwal silk-cotton sarees', 'Nirmal lacquered furniture & toys', 'Bidriware vases, boxes & jewellery', 'Brass & copper temple ware'],
    clusters: ['Pochampally (Bhoodan Pochampally) — 50 km from Hyderabad', 'Gadwal — 180 km from Hyderabad', 'Nirmal — 300 km north, near Adilabad', 'Karimnagar for silver filigree'],
    visit: 'Best visited October–March. Pochampally village has a Handloom Park where you can watch Ikat weaving live. Gadwal hosts a weekly craft market.',
    funFact: 'A single Pochampally Ikat saree has over 5,000 individual thread-tie-and-dye operations before the first thread is woven.',
  },
  ap: {
    name: 'Andhra Pradesh',
    tagline: 'Where Art Meets Ancient Dyes',
    emoji: '🎨',
    color: '#2c6e49',
    culture: `Andhra Pradesh carries the spirit of the ancient Satavahana and Vijayanagara empires. It is the home of Kuchipudi classical dance, Harikatha musical storytelling, and the world-famous Tirupati temple. The coastal Andhra cuisine is beloved across India, and the state's cultural fabric is woven with Telugu poetry, Carnatic music, and vibrant Ugadi festival celebrations.`,
    crafts: [
      { name: 'Kalamkari', desc: 'Hand-painted or block-printed textiles using only natural dyes — a 3,000-year-old tradition.', gi: true },
      { name: 'Kondapalli Toys', desc: 'Soft light-weight teak wood painted in bright colours, depicting rural scenes and mythology.', gi: true },
      { name: 'Etikoppaka Lacware', desc: 'Lacquer-turned wooden toys coloured with natural dyes from seeds, bark, and plants.', gi: true },
      { name: 'Dharmavaram Silk', desc: 'Heavy pure silk sarees with broad zari borders — the pride of marriage trousseaus.', gi: true },
      { name: 'Uppada Jamdani', desc: 'Extremely lightweight muslin weaving with extra-weft floral designs.', gi: true },
    ],
    products: ['Kalamkari cotton & silk fabrics', 'Kondapalli painted wooden toys', 'Etikoppaka eco-friendly toys', 'Dharmavaram silk pattu sarees'],
    clusters: ['Sri Kalahasti — for hand-painted Kalamkari', 'Machilipatnam — for block-printed Kalamkari', 'Kondapalli near Vijayawada', 'Etikoppaka near Rajahmundry'],
    visit: 'Sri Kalahasti, near Tirupati, is the epicentre of hand-painted Kalamkari. Kondapalli fort village welcomes visitors. Etikoppaka on Vamsadhara river is a craft heritage site.',
    funFact: 'Kalamkari (kalam = pen, kari = work) uses a bamboo or date-palm pen to paint with natural dyes. Colours are fixed by boiling in tannin-rich myrobalan water.',
  },
  rajasthan: {
    name: 'Rajasthan',
    tagline: 'The Royal Craft Kingdom',
    emoji: '👑',
    color: '#e67e22',
    culture: `Rajasthan is the land of Maharajas, desert forts, and thousand-year traditions. Its culture is a riot of colour — from Ghoomar and Kalbeliya dances to Langa-Manganiyar folk music and the world's largest cattle fair at Pushkar. Every inch of Rajasthan tells a story — through its painted havelis, blue-domed pottery, and intricate block-printed fabrics.`,
    crafts: [
      { name: 'Bagru Block Printing', desc: 'Centuries-old resist printing using carved wooden blocks and natural indigo/alizarin dyes.', gi: true },
      { name: 'Blue Pottery', desc: 'Made from quartz, not clay — Jaipur\'s unique Persian-influenced turquoise pottery.', gi: true },
      { name: 'Bandhani', desc: 'Tie-dye fabric created by tying thousands of tiny knots by hand — every dot a separate tie.', gi: true },
      { name: 'Miniature Painting', desc: 'Painstakingly detailed paintings on paper, ivory, and silk depicting Mughal and Rajput court life.', gi: false },
      { name: 'Thewa Jewellery', desc: 'Gold work fused onto multi-coloured glass — an art form exclusive to Pratapgarh.', gi: true },
    ],
    products: ['Bagru & Sanganer block-printed fabrics', 'Blue pottery jars & tiles', 'Bandhani dupattas & sarees', 'Jaipur gemstone jewellery', 'Puppets, leather camels, brassware'],
    clusters: ['Bagru — 30 km from Jaipur', 'Sanganer — 16 km from Jaipur', 'Pottery workshops in Jaipur city', 'Nathdwara for Pichwai paintings'],
    visit: 'Bagru village can be visited year-round. Watch printers at work in their courtyards. Sanganer\'s workshops line the Saraswati river banks. Best month for Jaipur crafts: October–February.',
    funFact: 'Jaipur Blue Pottery contains no clay. It\'s made from powdered quartz stone, glass, Multani clay and katira gum — making it technically a glass-ceramic fusion.',
  },
  gujarat: {
    name: 'Gujarat',
    tagline: 'Colours of the Desert & Sea',
    emoji: '🪅',
    color: '#8e44ad',
    culture: `Gujarat is a state of extraordinary contrasts — from the stark white salt flats of the Rann of Kutch to the lush Gir forests and the sacred Dwarka coast. Navratri, celebrated here for 9 nights with Garba and Dandiya Raas, is the world's largest dance festival. The Rann Utsav attracts thousands every winter. Gujarat's entrepreneurial spirit is matched only by its craft diversity.`,
    crafts: [
      { name: 'Patan Patola', desc: 'Double Ikat silk sarees — only 3 families know the technique. Takes 6-12 months to make one.', gi: true },
      { name: 'Kutch Embroidery', desc: '16 distinct styles of mirror-work embroidery from different Kutch communities.', gi: true },
      { name: 'Bandhani', desc: 'Tie-dye from Jamnagar and Bhuj — thousands of tiny dots tied by hand.', gi: true },
      { name: 'Ajrakh Block Printing', desc: 'Geometric block prints using natural resist and natural dyes — worn by Sindhi communities.', gi: false },
      { name: 'Rogan Art', desc: 'Castor-oil based paint applied on cloth using a stylus — only one family in Nirona makes it.', gi: false },
    ],
    products: ['Patan Patola silk sarees', 'Kutch embroidery shawls & bags', 'Bandhani fabrics', 'Ajrakh block-printed cloth', 'Rogan art wall hangings'],
    clusters: ['Patan — 130 km from Ahmedabad for Patola', 'Bhuj — centre of Kutch crafts', 'Jamnagar for Bandhani', 'Ajrakhpur village near Bhuj'],
    visit: 'Kutch craft villages are best accessed from Bhuj. Nirona for Rogan art (only one Khatri family). Bhujodi for weaving. Best time: October–February for Rann Utsav.',
    funFact: 'A single Patan Patola saree costs ₹1–5 lakhs and takes up to one year. The Salvi family of Patan has been weaving Patola for generations and the knowledge is passed only within the family.',
  },
  karnataka: {
    name: 'Karnataka',
    tagline: 'Silk, Sandalwood & Stone',
    emoji: '🏛️',
    color: '#f39c12',
    culture: `Karnataka is one of India's richest cultural tapestries — from Carnatic music's birthplace in Mysuru to the rock-art caves of Badami, the UNESCO-listed Hampi ruins, and the vibrant Yakshagana dance theatre. Dasara in Mysuru draws millions each October. The state's cuisine ranges from coastal Udupi vegetarian to Coorgi pork curries.`,
    crafts: [
      { name: 'Mysore Silk', desc: 'Pure mulberry silk with solid gold zari — Mysuru produces some of India\'s finest silk.', gi: true },
      { name: 'Channapatna Toys', desc: 'Lacquered wooden toys and kitchen sets from the "Toy Town" on Bengaluru–Mysuru highway.', gi: true },
      { name: 'Bidriware', desc: 'Silver-inlaid zinc alloy metalwork from Bidar — a Bahmani Sultanate tradition.', gi: true },
      { name: 'Ilkal Sarees', desc: 'Cotton-silk combination sarees with distinctive Kasuti embroidery borders from North Karnataka.', gi: true },
      { name: 'Rosewood Inlay', desc: 'Ornate furniture and boxes with geometric ivory or brass inlay — a Mysuru tradition.', gi: false },
    ],
    products: ['Mysore silk sarees', 'Channapatna wooden toys, bowls & spinning tops', 'Bidriware boxes & vases', 'Sandalwood carvings', 'Kasuti embroidery'],
    clusters: ['Channapatna — 60 km south of Bengaluru', 'Mysuru for silk weaving (KSIC factory)', 'Bidar for Bidriware', 'Dharwad area for Ilkal'],
    visit: 'Channapatna\'s toy workshops welcome visitors. The KSIC Silk Factory in Mysuru gives guided tours. Bidar is 150 km from Hyderabad — Bidriware can be watched at the craft cluster.',
    funFact: 'Channapatna toys were popularised by Hyder Ali, who invited Persian craftsmen to teach the technique. Today, 5,000+ artisans work in this one town.',
  },
  tn: {
    name: 'Tamil Nadu',
    tagline: 'Classical Arts of the Dravidian South',
    emoji: '🛕',
    color: '#c0392b',
    culture: `Tamil Nadu is the guardian of India's oldest surviving classical traditions. Bharatanatyam dance, Carnatic music, and temple architecture here date back over 2,000 years. The grand Dravidian gopuram (tower) temples of Madurai, Thanjavur, and Chidambaram are living museums. The language Tamil itself is one of the world's oldest classical languages still widely spoken.`,
    crafts: [
      { name: 'Kanchipuram Silk', desc: 'The queen of Indian sarees — pure mulberry silk with zari, woven near Chennai for 2,000 years.', gi: true },
      { name: 'Swamimalai Bronze', desc: 'Lost-wax (Cire Perdue) Panchaloha bronze casting following 1,000-year-old Chola techniques.', gi: true },
      { name: 'Thanjavur Paintings', desc: 'Gold-leaf embossed glass paintings with jewel embellishments depicting Hindu deities.', gi: true },
      { name: 'Chettinad Pottery', desc: 'Terracotta pots, tiles, and water containers made using traditional Chettinad techniques.', gi: false },
      { name: 'Palmyra Crafts', desc: 'Basketry, fans, and mats from the Palmyra palm — a Southern Tamil tradition.', gi: false },
    ],
    products: ['Kanchipuram silk sarees', 'Panchaloha bronze Nataraja statues', 'Thanjavur gold-leaf paintings', 'Tanjore doll (thanjavur thalayatti bommai)'],
    clusters: ['Kanchipuram — 70 km from Chennai', 'Swamimalai — near Kumbakonam', 'Thanjavur city for paintings', 'Tiruchendur for shell craft'],
    visit: 'Kanchipuram Silk Weavers\' Colony open to visitors. Swamimalai bronze workshops along the main road. Thanjavur has the Brihadeeswarar temple and art galleries.',
    funFact: 'Swamimalai artisans never write down the lost-wax process. It is transmitted orally, father to son, for 65+ generations. The exact alloy proportion of Panchaloha (5 metals) is a closely guarded secret.',
  },
  wb: {
    name: 'West Bengal',
    tagline: 'Bengal Renaissance in Thread & Clay',
    emoji: '🌸',
    color: '#e91e63',
    culture: `West Bengal gave India Rabindranath Tagore, the Bengal Renaissance, and some of the world's finest intellectual and artistic traditions. Durga Puja here is an 11-day cultural festival that UNESCO recognised as Intangible Cultural Heritage. The state blends Bengali, tribal Santali, and tea-garden cultures into one rich identity.`,
    crafts: [
      { name: 'Kantha Embroidery', desc: 'Running-stitch embroidery on old sarees — created by rural women during lean farming seasons.', gi: true },
      { name: 'Bishnupur Terracotta', desc: 'Temple sculptures and jewellery from the ancient Malla dynasty\'s capital.', gi: false },
      { name: 'Baluchari Silk', desc: 'Silk sarees with woven narrative panels depicting scenes from Mahabharata and Ramayana.', gi: true },
      { name: 'Dhokra Metal', desc: 'Lost-wax cast tribal figures from Bankura district — a 4,000-year-old craft.', gi: false },
      { name: 'Shola Work', desc: 'Intricate white sculptures from sponge-wood (shola plant) used in wedding headgear.', gi: false },
    ],
    products: ['Kantha quilts & embroidered sarees', 'Bishnupur terracotta jewellery', 'Baluchari silk sarees', 'Bankura horse terracotta', 'Muslin fabrics'],
    clusters: ['Murshidabad for silk & Kantha', 'Bishnupur — 200 km from Kolkata', 'Bankura for Dhokra & terracotta', 'Shantiniketan for Kantha & Batik'],
    visit: 'Shantiniketan (Tagore\'s university town) has a vibrant craft market. Bishnupur terracotta temples are UNESCO-recommended. Best visited October–February.',
    funFact: 'Kantha literally means "rags" in Bengali. What began as recycling old, worn sarees into quilts for babies evolved into one of India\'s most celebrated embroidery traditions.',
  },
  odisha: {
    name: 'Odisha',
    tagline: 'Pattachitra, Ikat & Ancient Stone',
    emoji: '🪷',
    color: '#27ae60',
    culture: `Odisha (Orissa) guards some of India's most spectacular ancient heritage — the Konark Sun Temple, Jagannath Puri, and the Buddhist monasteries of Ratnagiri. Odissi, one of India's eight classical dances, originated here. The state is also home to 62 tribal communities, each with distinct craft traditions. The Rath Yatra at Puri draws millions of pilgrims every year.`,
    crafts: [
      { name: 'Pattachitra', desc: 'Cloth paintings using natural pigments — depicting Jagannath stories from the Puri Jagannath tradition.', gi: true },
      { name: 'Sambalpuri Ikat', desc: 'Tie-dye woven sarees where the pattern is set before weaving — called "bandha" or knotted weaving.', gi: true },
      { name: 'Dhokra', desc: 'Bell-metal lost-wax casting from tribal communities — birds, horses, deity figurines.', gi: false },
      { name: 'Pipli Appliqué', desc: 'Colourful cut-cloth appliqué work originally made for Puri Jagannath temple canopies.', gi: true },
      { name: 'Stone Carving', desc: 'Intricate sculptures in Khondalite stone continuing the Konark temple tradition.', gi: false },
    ],
    products: ['Pattachitra paintings on cloth & palm leaf', 'Sambalpuri silk Ikat sarees', 'Dhokra metal figurines', 'Pipli umbrellas & bags', 'Konark stone carvings'],
    clusters: ['Raghurajpur Heritage Village near Puri', 'Sambalpur for Ikat', 'Pipli — 35 km from Bhubaneswar', 'Baripada for Dhokra'],
    visit: 'Raghurajpur is India\'s only "Heritage Craft Village" — every family is an artist. Open daily. Located 14 km from Puri.',
    funFact: 'In Raghurajpur, children learn Pattachitra before they learn to write. The village has a 500-year-old tradition where newborns are gifted their first painting materials.',
  },
  up: {
    name: 'Uttar Pradesh',
    tagline: 'Silk, Shadow Work & Sacred Ghats',
    emoji: '🕌',
    color: '#2980b9',
    culture: `Uttar Pradesh holds India's most sacred geography — the ghats of Varanasi where the Ganga flows, the birthplace of Lord Krishna at Mathura, and the Taj Mahal at Agra. The state blends ancient Hindu civilisation with Mughal grandeur and Nawabi refinement. Lucknow's tehzeeb (refined courtesy culture), Banarasi music, and Kathak dance all originated here.`,
    crafts: [
      { name: 'Banarasi Silk', desc: 'Silk brocade sarees with gold and silver zari — woven in Varanasi\'s pit-loom homes for 500+ years.', gi: true },
      { name: 'Chikankari', desc: 'Lucknow\'s shadow-work embroidery — 32 stitches on fine muslin, originally taught in Mughal courts.', gi: true },
      { name: 'Zardozi', desc: 'Heavy metallic embroidery with gold threads, sequins, and beads on velvet and silk.', gi: false },
      { name: 'Brassware', desc: 'Varanasi\'s cast-brass diyas, bells, and statues used in temples across India.', gi: false },
      { name: 'Carpet Weaving', desc: 'Bhadohi and Mirzapur produce hand-knotted Persian-style wool carpets exported worldwide.', gi: true },
    ],
    products: ['Banarasi silk brocade sarees', 'Lucknow Chikankari kurtas & sarees', 'Agra marble inlay (Pietra Dura)', 'Varanasi brass diyas', 'Bhadohi hand-knotted carpets'],
    clusters: ['Varanasi — Madanpura, Adalat area for silk', 'Lucknow — Hazratganj area for Chikankari', 'Bhadohi — "Carpet City" 65 km from Varanasi', 'Agra for marble inlay'],
    visit: 'Varanasi\'s silk weavers work in narrow lanes near Madanpura mosque. Many welcome visitors. Best: October–March. Lucknow Chikankari bazaar in Aminabad is open daily.',
    funFact: 'The finest Banarasi Kadwa brocade weaving uses over 1,200 threads per inch, and a single ceremonial saree takes a master weaver 6 months to complete.',
  },
  mp: {
    name: 'Madhya Pradesh',
    tagline: 'Heart of India\'s Craft Tradition',
    emoji: '🌿',
    color: '#16a085',
    culture: `Madhya Pradesh is literally the Heart of India — in geography and culture. From the erotic sculptures of Khajuraho to the Buddhist peace of Sanchi, and from Gond tribal paintings to Malwa folk music, the state contains multitudes. The Bundeli, Malwi, Bagheli, and Gondwani cultural traditions create a rich mosaic. The sacred Narmada river flows through its heart.`,
    crafts: [
      { name: 'Chanderi Silk', desc: 'Gossamer silk-cotton fabric so fine it\'s called "woven air" — worn by Mughal empresses.', gi: true },
      { name: 'Maheshwari Sarees', desc: 'Silk-cotton sarees revived by Queen Ahilyabai Holkar in the 18th century — distinctive reversible border.', gi: true },
      { name: 'Gond Art', desc: 'Tribal dot-and-line paintings inspired by forest life and Gondi mythology — now globally collected.', gi: false },
      { name: 'Bagh Block Printing', desc: 'Natural-dye block printing from Bagh village using river clay as resist.', gi: true },
      { name: 'Dhokra Casting', desc: 'Lost-wax tribal metal figurines from Bastar — elephants, tribal women, animals.', gi: false },
    ],
    products: ['Chanderi sheer sarees & dress material', 'Maheshwari silk-cotton sarees', 'Gond art paintings', 'Bagh-printed cotton fabrics', 'Bastar Dhokra metal craft'],
    clusters: ['Chanderi — 220 km from Bhopal', 'Maheshwar — 90 km from Indore on Narmada', 'Bagh village near Dhar for block printing', 'Bastar for tribal Dhokra'],
    visit: 'Maheshwar is a stunning heritage town on the Narmada — weavers work in riverside workshops. Chanderi has a dedicated Handloom Cluster. Best time: October–March.',
    funFact: 'A Chanderi saree can be pulled through a finger ring. The fabric\'s transparent quality comes from the unique weave where a single silk thread is used for warp while cotton is used for weft.',
  },
  bihar: {
    name: 'Bihar',
    tagline: 'Mithila Art & Ancient Grassroots',
    emoji: '🖼️',
    color: '#d35400',
    culture: `Bihar is the cradle of civilisation — home to Bodh Gaya, Vaishali, Nalanda, and the Maurya and Gupta empires. Its Maithili culture, Chhath Puja, and Bihari folk traditions are deeply rooted. The Mithila region is one of India's most celebrated homes of folk art.`,
    crafts: [
      { name: 'Madhubani Painting', desc: 'Geometric and nature-motif art using natural colours.', gi: true },
      { name: 'Sikki Grass Craft', desc: 'Golden grass baskets, dolls, and decorative pieces.', gi: false },
      { name: 'Sujni Embroidery', desc: 'Running-stitch quilts with distinct Bihari motifs.', gi: true },
      { name: 'Manjusha Art', desc: 'Snake-bordered folk box paintings from Bhagalpur.', gi: false },
      { name: 'Tikuli Art', desc: 'Metal-foil paintings of Bihari folk life from Patna.', gi: false },
    ],
    products: ['Madhubani paintings on paper and silk', 'Sikki grass decorative baskets', 'Sujni embroidered quilts', 'Manjusha boxes', 'Patna Tikuli art'],
    clusters: ['Jitwarpur village — 25 km from Madhubani town', 'Ranti village for Madhubani painting', 'Bhagalpur for Manjusha art and Tussar silk'],
    visit: 'Jitwarpur and Ranti villages welcome tourists — every home is a studio. Best visited November–February. Madhubani Railway Station walls are entirely painted by local artists.',
    funFact: 'Madhubani painting was "discovered" by a British colonial official, William Archer, after the 1934 earthquake destroyed walls — he found them so stunning he photographed them for the first time.',
  },
  assam: {
    name: 'Assam',
    tagline: 'Golden Silk of the Brahmaputra',
    emoji: '🌾',
    color: '#1abc9c',
    culture: `Assam is the land of the mighty Brahmaputra, one-horned rhinos, and India's finest tea. Its culture is a blend of indigenous Assamese, Bodo, Mising, Karbi, and other tribal traditions. Bihu is celebrated three times a year with Bihu dance and Bihu music. The Vaishnavite Sattriya classical dance, developed by 15th-century saint Srimanta Sankardev, is Assam's unique contribution to Indian classical arts.`,
    crafts: [
      { name: 'Muga Silk', desc: 'Exclusive to Assam — natural golden silk from the Antheraea assamensis silkworm. Gets more lustrous with age.', gi: true },
      { name: 'Mekhela Chador', desc: 'Assam\'s traditional two-piece silk garment — worn at festivals and weddings.', gi: false },
      { name: 'Bamboo Crafts', desc: 'Furniture, baskets, musical instruments — bamboo is woven into everyday Assamese life.', gi: false },
      { name: 'Bell Metal Craft', desc: 'Sarthebari bell-metal utensils, idols, and lamps — used in Vaishnavite satras.', gi: false },
      { name: 'Cane Work', desc: 'Intricate cane chairs, mats, and decorative items from Assam\'s forests.', gi: false },
    ],
    products: ['Muga silk sarees & mekhela chador', 'Eri silk shawls', 'Bamboo furniture', 'Sarthebari bell-metal utensils', 'Cane bags & baskets'],
    clusters: ['Sualkuchi — "Manchester of Assam" 35 km from Guwahati', 'Sarthebari for bell metal', 'Majuli Island for bamboo & mask crafts', 'Barpeta for cane weaving'],
    visit: 'Sualkuchi is one long weaving street — every house has a loom. Majuli (world\'s largest river island) has traditional mask-making for Sattriya dance. Best: October–March.',
    funFact: 'Muga silk is the only naturally coloured golden silk in the world. The older a Muga saree gets, the more golden and lustrous it becomes — it\'s said a 100-year-old Muga saree is more beautiful than a new one.',
  },
  kerala: {
    name: 'Kerala',
    tagline: 'God\'s Own Crafts',
    emoji: '🌴',
    color: '#27ae60',
    culture: `Kerala is "God's Own Country" — a narrow strip of extraordinary biodiversity, ancient spice trade routes, and one of the world's oldest Christian communities. Its arts are remarkable: Kathakali's elaborate makeup and costumes, Mohiniyattam's graceful feminine form, and Kalaripayattu — the world's oldest martial art. The Kerala backwaters, Onam harvest festival, and communal feast (sadya) define its cultural identity.`,
    crafts: [
      { name: 'Coir Weaving', desc: 'Mats, rugs, and furniture from coconut-husk fibre — Kerala produces 60% of India\'s coir.', gi: false },
      { name: 'Aranmula Metal Mirror', desc: 'The only metal mirror in the world — secret alloy reflecting without distortion. UNESCO-listed.', gi: true },
      { name: 'Kasavu Weaving', desc: 'Off-white cotton sarees with gold border (kasavu) — worn by Malayali women at Onam.', gi: false },
      { name: 'Kathakali Costume Craft', desc: 'Elaborate headdress, facemask and costume construction for Kathakali classical dance.', gi: false },
      { name: 'Wood Carving', desc: 'Rosewood and teak carving of temple panels, elephants, and furniture.', gi: false },
    ],
    products: ['Coir door mats & floor rugs', 'Aranmula Kannadi metal mirrors', 'Kasavu sarees', 'Rosewood elephant figurines', 'Coconut shell craft'],
    clusters: ['Aranmula — near Pathanamthitta for metal mirror', 'Chendamangalam for kasavu weaving', 'Alleppey (Alappuzha) for coir', 'Thrissur for bronze & bell metal'],
    visit: 'Aranmula is 20 km from Changanacherry — the Kannadi-making family homes are open for visits. Chendamangalam Weaving Cooperative near Kochi. Best: September–February.',
    funFact: 'The Aranmula Kannadi is made from a secret alloy of copper, tin, lead, zinc, and other metals. The exact proportions are known only to a few families and have never been scientifically published.',
  },
  jk: {
    name: 'Jammu & Kashmir',
    tagline: 'Himalayan Artistry in Wool & Wood',
    emoji: '🏔️',
    color: '#9b59b6',
    culture: `Jammu & Kashmir is where the Himalayan mountains meet human artistry. Dal Lake's shikara-dotted waters, the Mughal gardens, Sufi shrines of the Rishi order, and the Ladakhi Buddhist monasteries create a landscape unlike anywhere else. The culture blends Persian, Central Asian, Tibetan, and Punjabi influences. Kashmiri wazwan cuisine, Rouf dance, and Chakri folk music are deeply loved.`,
    crafts: [
      { name: 'Pashmina Shawl', desc: 'Hand-spun from Changra goat\'s winter undercoat at 4,000m altitude — the world\'s finest wool.', gi: true },
      { name: 'Papier-Mâché', desc: 'Lacquered decorative boxes, vases, and ornaments painted with intricate floral designs.', gi: false },
      { name: 'Kashmiri Carpet', desc: 'Hand-knotted silk or wool carpets with Persian designs — up to 900 knots per square inch.', gi: true },
      { name: 'Sozni Embroidery', desc: 'Needle embroidery on Pashmina and silk — used to create fine shawl borders.', gi: true },
      { name: 'Walnut Wood Carving', desc: 'Intricately carved walnut furniture and screens with floral and geometric patterns.', gi: true },
    ],
    products: ['Pashmina shawls & stoles', 'Papier-mâché boxes & ornaments', 'Hand-knotted silk carpets', 'Sozni embroidered shawls', 'Walnut carved furniture'],
    clusters: ['Srinagar — Dal Lake area for most crafts', 'Kanihama for Kani shawls', 'Leh for Pashmina sourcing', 'Sopore for carpet weaving'],
    visit: 'Srinagar\'s old city (Old Downtown) has weaving workshops you can walk into. Carpet weaving is visible at the Craft Development Institute. Best visited: May–September.',
    funFact: 'A genuine Pashmina ring shawl can be pulled through a ring the size of your finger. The Changra goat sheds its winter coat naturally in spring — it is combed, not sheared, to preserve fibre length.',
  },
  punjab: {
    name: 'Punjab',
    tagline: 'Five Rivers of Folk Art',
    emoji: '🌻',
    color: '#f39c12',
    culture: `Punjab — "land of five rivers" — pulses with energy. Bhangra's foot-stomping beats and Giddha's graceful movements define its folk arts. The Golden Temple in Amritsar is the world's most visited site. Lohri bonfires, Baisakhi harvest festival, and the spirit of seva (selfless service) through langar define Punjabi identity. The state also has a strong Sufi music tradition through dargahs.`,
    crafts: [
      { name: 'Phulkari', desc: 'Floral embroidery entirely in silk floss on hand-spun cotton — made by women for weddings.', gi: true },
      { name: 'Punjabi Jutti', desc: 'Hand-stitched leather footwear with intricate thread and bead embroidery.', gi: false },
      { name: 'Durrie Weaving', desc: 'Flat-woven cotton rugs with geometric patterns from Shahpur Kandi and Bhadson.', gi: false },
      { name: 'Pottery', desc: 'Blue pottery from Amritsar and unglazed terracotta from the foothills.', gi: false },
      { name: 'Patiala Salwar', desc: 'The distinctive pleated salwar with over 100 pleats — a Patiala Royal court tradition.', gi: false },
    ],
    products: ['Phulkari embroidered dupattas & suits', 'Punjabi Jutti leather shoes', 'Amritsari phulkari', 'Wooden inlay work', 'Pottery & ceramic ware'],
    clusters: ['Patiala for Phulkari & Jutti', 'Amritsar city for shawls and handicrafts', 'Hoshiarpur for wood inlay', 'Mukerian for durrie weaving'],
    visit: 'Patiala\'s old city bazaars have the best Phulkari and Jutti workshops. Amritsar\'s Hall Bazaar is famous for craft shopping near the Golden Temple.',
    funFact: 'A Phulkari (flower work) garment has embroidery only on one side. When it completely covers the base cloth, it\'s called a "Bagh" (garden). A Bagh trousseau could take 3 years to complete.',
  },
  hp: {
    name: 'Himachal Pradesh',
    tagline: 'Mountain Crafts from the Roof of India',
    emoji: '⛰️',
    color: '#3498db',
    culture: `Himachal Pradesh ("Abode of Snow" Province) is where snow-capped Himalayan peaks meet apple orchards and ancient deodar forests. The state blends Hindu and Buddhist traditions — ancient temples at Spiti and Lahaul coexist with Hindu pilgrimage sites of Shimla and Mandi. Kullu Dussehra brings 200+ local deities together for a 7-day celebration. Himachali folk music and the ancient Nati dance are unique mountain traditions.`,
    crafts: [
      { name: 'Kullu Shawls', desc: 'Bold geometric-pattern shawls woven from Angora rabbit and local sheep wool on pit looms.', gi: true },
      { name: 'Chamba Rumal', desc: 'Double-sided embroidery with no wrong side — originally made for Chamba court ritual offerings.', gi: true },
      { name: 'Kangra Miniature', desc: 'Delicate paintings with natural pigments depicting Radha-Krishna, Pahari kings, and mountain life.', gi: false },
      { name: 'Thangka Painting', desc: 'Tibetan Buddhist scroll paintings from Dharamsala and Spiti — depicting deities and mandalas.', gi: false },
      { name: 'Wood Carving', desc: 'Deodar and Kail pine carving for temple panels, doors, and decorative items.', gi: false },
    ],
    products: ['Kullu shawls & blankets', 'Chamba Rumal embroidery', 'Kangra miniature paintings', 'Thangka scrolls', 'Wooden walking sticks & carved panels'],
    clusters: ['Kullu Valley for shawl weaving', 'Chamba town for Rumal', 'Kangra for miniature painting', 'Dharamsala (McLeod Ganj) for Thangka'],
    visit: 'Kullu town has a government craft emporium and can arrange weaver visits. Chamba is 120 km from Pathankot. Kangra Art Museum has the finest collection.',
    funFact: 'Chamba Rumal is technically impossible to distinguish front from back — the embroidery is identical on both sides. This double-sided technique, using a special reversible stitch, takes decades to master.',
  },
};

export default function StateDetailModal({ stateKey, onClose }) {
  const overlayRef = useRef(null);
  const data = STATE_DATA[stateKey];

  // Escape to close
  useEffect(() => {
    const fn = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', fn);
    // Prevent body scroll while modal open
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', fn);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  if (!data) return null;

  const giCrafts = data.crafts.filter((c) => c.gi).map((c) => c.name);
  const topProducts = data.products.slice(0, 3);
  const topClusters = data.clusters.slice(0, 2);

  const chatbotContext = `You are answering questions about ${data.name}, India.
State: ${data.name}
Tagline: ${data.tagline}
Famous crafts: ${data.crafts.map(c => c.name).join(', ')}
GI-tagged crafts: ${giCrafts.join(', ') || 'None listed'}
Culture summary: ${data.culture.slice(0, 300)}
Key products: ${data.products.join(', ')}
Best places to visit: ${data.clusters.join(', ')}
Visit tip: ${data.visit}
Fun fact: ${data.funFact}
Always be accurate and helpful about ${data.name}'s crafts, culture, products, GI tags, and how to visit artisans through CraftTrail.`;

  return (
    <div
      className="sdm__overlay"
      ref={overlayRef}
      onClick={(e) => e.target === overlayRef.current && onClose()}
      role="dialog"
      aria-modal="true"
      aria-label={`${data.name} Heritage Details`}
    >
      <div className="sdm__panel">
        {/* Close button */}
        <button className="sdm__close" onClick={onClose} aria-label="Close">×</button>

        <div className="sdm__grid">
          {/* ── LEFT: Heritage information ──────────────────────── */}
          <div className="sdm__left">
            {/* Hero header */}
            <div className="sdm__hero" style={{ '--state-color': data.color }}>
              <span className="sdm__emoji">{data.emoji}</span>
              <div>
                <h2 className="sdm__state-name">{data.name}</h2>
                <p className="sdm__tagline">{data.tagline}</p>
              </div>
            </div>

            <div className="sdm__content">
              <section className="sdm__summary">
                <div className="sdm__summary-card">
                  <span className="sdm__summary-label">GI-tagged crafts</span>
                  <strong className="sdm__summary-value">{giCrafts.length ? giCrafts.join(' · ') : 'Not listed'}</strong>
                </div>
                <div className="sdm__summary-card">
                  <span className="sdm__summary-label">Products to buy</span>
                  <strong className="sdm__summary-value">{topProducts.join(' · ')}</strong>
                </div>
                <div className="sdm__summary-card">
                  <span className="sdm__summary-label">Craft clusters</span>
                  <strong className="sdm__summary-value">{topClusters.join(' · ')}</strong>
                </div>
              </section>

              {/* Culture */}
              <section className="sdm__section">
                <h3 className="sdm__section-title">
                  <span className="sdm__dot" style={{ background: data.color }} />
                  Culture & Heritage
                </h3>
                <p className="sdm__body">{data.culture}</p>
              </section>

              {/* Crafts */}
              <section className="sdm__section">
                <h3 className="sdm__section-title">
                  <span className="sdm__dot" style={{ background: data.color }} />
                  Crafts & Art Forms
                </h3>
                <div className="sdm__crafts">
                  {data.crafts.map((c) => (
                    <div key={c.name} className="sdm__craft-card">
                      <div className="sdm__craft-top">
                        <strong className="sdm__craft-name">{c.name}</strong>
                        {c.gi && <span className="sdm__gi-badge">GI Tagged</span>}
                      </div>
                      <p className="sdm__craft-desc">{c.desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              {/* Products */}
              <section className="sdm__section">
                <h3 className="sdm__section-title">
                  <span className="sdm__dot" style={{ background: data.color }} />
                  Products You Can Buy
                </h3>
                <ul className="sdm__list">
                  {data.products.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </section>

              {/* Craft Clusters */}
              <section className="sdm__section">
                <h3 className="sdm__section-title">
                  <span className="sdm__dot" style={{ background: data.color }} />
                  Craft Clusters to Visit
                </h3>
                <ul className="sdm__list sdm__list--clusters">
                  {data.clusters.map((cl) => (
                    <li key={cl}>
                      <span className="sdm__pin">📍</span> {cl}
                    </li>
                  ))}
                </ul>
                <div className="sdm__visit-tip">
                  <span className="sdm__tip-icon">💡</span>
                  <span>{data.visit}</span>
                </div>
              </section>

              {/* Fun fact */}
              <div className="sdm__funfact" style={{ borderColor: data.color }}>
                <span className="sdm__funfact-label">✨ Did you know?</span>
                <p>{data.funFact}</p>
              </div>
            </div>
          </div>

          {/* ── RIGHT: AI Chatbot ────────────────────────────────── */}
          <div className="sdm__right">
            <div className="sdm__chat-header">
              <span className="sdm__chat-icon">🤖</span>
              <div>
                <div className="sdm__chat-title">Ask CraftBot</div>
                <div className="sdm__chat-sub">
                  AI-powered guide for {data.name}'s crafts &amp; culture
                </div>
              </div>
            </div>
            <div className="sdm__chat-body">
              <InlineChatbot
                context={chatbotContext}
                stateName={data.name}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
