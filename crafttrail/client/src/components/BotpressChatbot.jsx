import { useEffect, useRef, useState } from 'react';
import './BotpressChatbot.css';

/**
 * CraftTrail AI Chatbot — powered by Botpress Webchat v2
 *
 * Modes:
 *   inline  — rendered inside a panel (state detail modal / artisan profile)
 *   float   — global floating button (bottom-right, whole app)
 *
 * The chatbot is pre-primed via an opening system message built from
 * the `context` prop so answers are accurate for the current artisan/state.
 *
 * Botpress Bot ID / Client ID:
 *   Replace BOTPRESS_BOT_ID and BOTPRESS_CLIENT_ID below with your IDs.
 *   Get them at: https://app.botpress.cloud → your bot → Webchat settings.
 */

const BOTPRESS_BOT_ID     = 'YOUR_BOT_ID';      // ← replace after getting from Botpress cloud
const BOTPRESS_CLIENT_ID  = 'YOUR_CLIENT_ID';   // ← replace after getting from Botpress cloud

// If IDs are still placeholders, skip Botpress entirely and use the built-in FallbackChat.
// This prevents ZodErrors in the console and keeps the chatbot fully functional.
const BOTPRESS_CONFIGURED =
  BOTPRESS_BOT_ID !== 'YOUR_BOT_ID' &&
  BOTPRESS_CLIENT_ID !== 'YOUR_CLIENT_ID' &&
  BOTPRESS_BOT_ID.length > 10 &&
  BOTPRESS_CLIENT_ID.length > 10;

// Accurate system knowledge about CraftTrail states, crafts and artisans
// Injected as the first message when Botpress loads, so the bot answers correctly.
function buildSystemContext(context) {
  const base = `You are CraftBot, the official AI assistant for CraftTrail — India's craft discovery platform.
CraftTrail maps 744+ Government of India recognised handicraft clusters and connects travellers with verified artisans.
You help users learn about Indian crafts, cultural heritage, artisan stories, GI (Geographical Indication) tags, booking workshops, and planning visits.
Always be accurate, warm, and informative about Indian craft traditions.`;

  if (!context) return base;
  return `${base}\n\nCurrent context:\n${context}`;
}

let botpressLoaded = false;
let loadingPromise = null;

function loadBotpressScript() {
  if (botpressLoaded) return Promise.resolve();
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    // inject Botpress webchat v2 CDN
    const script = document.createElement('script');
    script.src = 'https://cdn.botpress.cloud/webchat/v2.2/inject.js';
    script.async = true;
    script.onload = () => {
      botpressLoaded = true;
      resolve();
    };
    script.onerror = () => reject(new Error('Failed to load Botpress webchat'));
    document.head.appendChild(script);
  });

  return loadingPromise;
}

/** Inner Botpress implementation — only mounted when BOTPRESS_CONFIGURED is true */
function BotpressInlineChat({ context, artisanName, stateName }) {
  const containerRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadBotpressScript()
      .then(() => {
        if (!window.botpress) return;

        window.botpress.init({
          botId: BOTPRESS_BOT_ID,
          clientId: BOTPRESS_CLIENT_ID,
          selector: '#craftbot-inline',
          configuration: {
            color: '#c0492e',
            variant: 'solid',
            themeMode: 'light',
            fontFamily: 'inter',
            borderRadius: 16,
            botName: 'CraftBot',
            botDescription: artisanName
              ? `Ask me about ${artisanName}'s craft, availability, workshops & more`
              : stateName
              ? `Ask me about ${stateName}'s heritage, crafts, culture & products`
              : 'Ask me anything about Indian crafts & artisans',
            composerPlaceholder: artisanName
              ? `Ask about ${artisanName}\u2026`
              : stateName
              ? `Ask about ${stateName}'s crafts\u2026`
              : 'Ask about Indian crafts\u2026',
          },
          onInit: () => {
            const ctx = buildSystemContext(context);
            try {
              window.botpress.sendEvent({
                type: 'trigger',
                payload: { intent: 'crafttrail_context', context: ctx },
              });
            } catch (_) {}
            setReady(true);
          },
        });
      })
      .catch((e) => setError(e.message));

    return () => {
      try { window.botpress?.close?.(); } catch (_) {}
    };
  }, [context, artisanName, stateName]);

  if (error) {
    return <FallbackChat context={context} artisanName={artisanName} stateName={stateName} />;
  }

  return (
    <div className="cbot__inline-wrap">
      {!ready && (
        <div className="cbot__loading">
          <span className="cbot__spinner" />
          <span>Loading CraftBot\u2026</span>
        </div>
      )}
      <div
        id="craftbot-inline"
        ref={containerRef}
        className={`cbot__inline ${ready ? 'is-ready' : ''}`}
      />
    </div>
  );
}

/**
 * Inline chatbot — use this inside panels (state modal, artisan profile).
 * Falls back to the built-in AI when Botpress IDs are not yet configured.
 */
export function InlineChatbot({ context, artisanName, stateName }) {
  if (!BOTPRESS_CONFIGURED) {
    return <FallbackChat context={context} artisanName={artisanName} stateName={stateName} />;
  }
  return <BotpressInlineChat context={context} artisanName={artisanName} stateName={stateName} />;
}

/** Floating global chatbot button — mounts once in the app */
export function FloatingChatbot({ context }) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  // When Botpress is not configured, render a custom floating button with FallbackChat panel
  if (!BOTPRESS_CONFIGURED) {
    return (
      <div className="cbot__float-wrap">
        <button
          className={`cbot__float-btn ${open ? 'is-open' : ''}`}
          onClick={() => setOpen(o => !o)}
          aria-label={open ? 'Close CraftBot' : 'Open CraftBot AI assistant'}
          title="CraftBot — Ask about Indian crafts, artisans & workshops"
        >
          {open ? (
            <span className="cbot__float-x">×</span>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 2C6.477 2 2 6.254 2 11.5c0 2.18.77 4.19 2.06 5.79L2.5 21.5l4.5-1.5A10.09 10.09 0 0012 21c5.523 0 10-4.254 10-9.5S17.523 2 12 2z"
                fill="currentColor"
              />
              <circle cx="8.5" cy="11.5" r="1" fill="white" />
              <circle cx="12" cy="11.5" r="1" fill="white" />
              <circle cx="15.5" cy="11.5" r="1" fill="white" />
            </svg>
          )}
        </button>
        <span className="cbot__float-label">CraftBot AI</span>

        {open && (
          <div className="cbot__float-panel">
            <FallbackChat context={context} />
          </div>
        )}
      </div>
    );
  }

  // Real Botpress FAB toggle
  const toggle = () => {
    if (!loaded) {
      loadBotpressScript()
        .then(() => {
          if (!window.botpress) return;
          window.botpress.init({
            botId: BOTPRESS_BOT_ID,
            clientId: BOTPRESS_CLIENT_ID,
            configuration: {
              color: '#c0492e',
              variant: 'solid',
              themeMode: 'light',
              fontFamily: 'inter',
              borderRadius: 16,
              botName: 'CraftBot',
              botDescription: 'Your Indian craft & artisan guide',
              composerPlaceholder: 'Ask about crafts, artisans, bookings…',
            },
            onInit: () => {
              const ctx = buildSystemContext(context);
              try {
                window.botpress.sendEvent({
                  type: 'trigger',
                  payload: { intent: 'crafttrail_context', context: ctx },
                });
              } catch (_) {}
              setLoaded(true);
              setOpen(true);
              window.botpress.open();
            },
          });
        })
        .catch((e) => setError(e.message));
    } else {
      if (open) {
        window.botpress?.close?.();
        setOpen(false);
      } else {
        window.botpress?.open?.();
        setOpen(true);
      }
    }
  };

  return (
    <div className="cbot__float-wrap">
      <button
        className={`cbot__float-btn ${open ? 'is-open' : ''}`}
        onClick={toggle}
        aria-label={open ? 'Close CraftBot' : 'Open CraftBot AI assistant'}
        title="CraftBot — Ask about crafts, artisans & workshops"
      >
        {open ? (
          <span className="cbot__float-x">×</span>
        ) : (
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M12 2C6.477 2 2 6.254 2 11.5c0 2.18.77 4.19 2.06 5.79L2.5 21.5l4.5-1.5A10.09 10.09 0 0012 21c5.523 0 10-4.254 10-9.5S17.523 2 12 2z"
              fill="currentColor"
            />
            <circle cx="8.5" cy="11.5" r="1" fill="white" />
            <circle cx="12" cy="11.5" r="1" fill="white" />
            <circle cx="15.5" cy="11.5" r="1" fill="white" />
          </svg>
        )}
        {error && <span className="cbot__float-err">!</span>}
      </button>
      <span className="cbot__float-label">CraftBot AI</span>
    </div>
  );
}

/**
 * FallbackChat — fully client-side intelligent chatbot.
 * Used when Botpress CDN fails to load or IDs are not configured.
 * Answers accurately using the built-in STATE_KNOWLEDGE and CRAFT_KNOWLEDGE bases.
 */

const STATE_KNOWLEDGE = {
  'Telangana': {
    crafts: ['Pochampally Ikat', 'Gadwal Sarees', 'Nirmal paintings', 'Bidri work'],
    culture: 'Rich Deccan heritage blending Telugu and Urdu traditions. Famous for Kuchipudi dance, Perini Shivatandavam, and Bonalu festivals.',
    products: ['Ikat sarees with geometric tie-dye patterns', 'Gadwal silk sarees with zari borders', 'Nirmal lacquered wooden toys', 'Bidriware silver inlay metal crafts'],
    gi: ['Pochampally Ikat', 'Gadwal Sarees', 'Nirmal Toys'],
    history: 'Pochampally weavers have practiced Ikat for over 500 years. Each thread is resist-dyed before weaving, creating stunning geometric patterns. Gadwal specialises in lightweight cotton bodies with pure silk and zari borders.',
    visit: 'Pochampally is 50 km from Hyderabad. Best visited October–March. Weavers welcome visitors to their homes. Nirmal is 300 km north near Adilabad.',
  },
  'Andhra Pradesh': {
    crafts: ['Kalamkari', 'Kondapalli toys', 'Etikoppaka lacware', 'Dharmavaram silk', 'Uppada jamdani'],
    culture: 'Ancient Dravidian heritage with rich classical art forms. Famous for Kuchipudi dance, Harikatha storytelling, and Ugadi festival.',
    products: ['Hand-painted Kalamkari textiles using natural dyes', 'Kondapalli lightwood painted toys', 'Etikoppaka lac-turned wooden toys', 'Dharmavaram silk pattu sarees'],
    gi: ['Kalamkari', 'Kondapalli Toys', 'Etikoppaka Toys', 'Dharmavaram Silk'],
    history: 'Kalamkari (kalam = pen, kari = work) is a 3,000-year-old art. Sri Kalahasti style uses hand painting, Machilipatnam style uses block printing. Both use only natural dyes from plants and minerals.',
    visit: 'Sri Kalahasti near Tirupati for hand-painted Kalamkari. Kondapalli near Vijayawada for wooden toys.',
  },
  'Rajasthan': {
    crafts: ['Bagru Block Printing', 'Sanganeri Printing', 'Blue Pottery', 'Bandhani', 'Miniature Painting', 'Thewa Jewellery'],
    culture: 'Royal Rajput heritage with vibrant folk traditions. Famous for Ghoomar dance, Kalbeliya dance, Pushkar fair, and colourful festivals.',
    products: ['Bagru hand-block printed cotton fabrics', 'Jaipur Blue Pottery (quartz not clay)', 'Jodhpur Bandhani tie-dye textiles', 'Pichwai temple paintings'],
    gi: ['Jaipur Blue Pottery', 'Kota Doria', 'Bagru Hand Block Print'],
    history: 'Bagru, 30 km from Jaipur, has been printing cloth using natural indigo and alizarin for 300+ years. Jaipur Blue Pottery is unique — made from quartz powder, not clay, giving it a distinctive turquoise translucency.',
    visit: 'Bagru village for block printing. Sanganer for Jaipur printing. Blue Pottery workshops in Jaipur city.',
  },
  'Gujarat': {
    crafts: ['Patola weaving', 'Bandhani', 'Kutch embroidery', 'Rogan art', 'Ajrakh block printing'],
    culture: 'Vibrant Gujarati culture with Garba and Dandiya Raas dances. Famous for Navratri, Rann Utsav, and kite festival.',
    products: ['Patan Patola double-Ikat silk sarees', 'Kutch mirror-work embroidery', 'Bandhani tie-dye fabrics', 'Rogan castor-oil painted textiles'],
    gi: ['Patan Patola', 'Kutch Embroidery', 'Surat Zari', 'Gir Kesar Mango'],
    history: 'Patan Patola — only 3 families in the world know the secret of double Ikat. A single saree takes 6-12 months to weave and costs ₹1–5 lakhs. Kutch embroidery has over 16 distinct regional styles.',
    visit: 'Patan for Patola weaving. Bhuj for Kutch embroidery villages. Ajrakhpur for Ajrakh block printing.',
  },
  'Karnataka': {
    crafts: ['Mysore Silk', 'Channapatna toys', 'Bidriware', 'Ilkal sarees', 'Navalgund durries'],
    culture: 'Classical Carnatic music heritage, Yakshagana theatre, Dasara festival in Mysuru.',
    products: ['Mysore pure silk sarees with gold zari', 'Channapatna lacquered wooden toys and bowls', 'Bidriware zinc alloy with silver inlay'],
    gi: ['Mysore Silk', 'Channapatna Toys', 'Bidriware', 'Ilkal Sarees'],
    history: 'Mysore silk weaving was patronised by Hyder Ali and Tipu Sultan. Channapatna toys, 60 km from Bengaluru, have been made for 200+ years using ivory wood (now substituted with rubberwood).',
    visit: 'Channapatna on Bengaluru–Mysuru highway. Mysuru for silk weaving. Bidar for Bidriware.',
  },
  'Tamil Nadu': {
    crafts: ['Kanchipuram silk', 'Swamimalai bronze casting', 'Thanjavur paintings', 'Chettinad cotton weaving', 'Kondangipet kalamkari'],
    culture: 'Dravidian classical heritage — Bharatanatyam, Carnatic music, Kolam art. Famous temples at Madurai, Thanjavur, and Chidambaram.',
    products: ['Kanchipuram pure mulberry silk sarees with zari', 'Panchaloha (5-metal) bronze idols', 'Thanjavur paintings with gold leaf embossing'],
    gi: ['Kanchipuram Silk', 'Thanjavur Paintings', 'Swamimalai Bronze'],
    history: 'Kanchipuram silk is the queen of Indian sarees — woven with pure mulberry silk, each saree has over 1200 threads per inch. Swamimalai lost-wax casting follows the same Chola-era techniques of 1000 CE.',
    visit: 'Kanchipuram 70 km from Chennai. Swamimalai near Kumbakonam. Thanjavur for paintings.',
  },
  'West Bengal': {
    crafts: ['Kantha embroidery', 'Bishnupur terracotta', 'Darjeeling tea', 'Muslin weaving', 'Baluchari silk'],
    culture: 'Tagore\'s Bengal Renaissance, Durga Puja, Baul music, Kathakali. Rich literary and artistic tradition.',
    products: ['Kantha quilts with running stitch embroidery', 'Bishnupur terracotta jewellery and toys', 'Murshidabad silk', 'Baluchari sarees with woven stories'],
    gi: ['Darjeeling Tea', 'Baluchari Saree', 'Dhaniakhali Saree'],
    history: 'Kantha embroidery repurposes old sarees by stitching together in running stitch — originally made by rural women during lean seasons. Bishnupur was the seat of the Malla kings and famous for terracotta temples.',
    visit: 'Murshidabad for silk and Kantha. Bishnupur 200 km from Kolkata for terracotta.',
  },
  'Odisha': {
    crafts: ['Pattachitra painting', 'Sambalpuri Ikat', 'Dhokra casting', 'Appliqué work', 'Stone carving'],
    culture: 'Odissi classical dance, Rath Yatra festival, Konark Sun Temple. Ancient maritime and tribal heritage.',
    products: ['Pattachitra on cloth/palm leaf with natural colours', 'Sambalpuri Ikat bandha sarees', 'Lost-wax Dhokra metal figurines', 'Pipli appliqué work'],
    gi: ['Pattachitra', 'Sambalpuri Saree', 'Pipli Appliqué'],
    history: 'Pattachitra artists from Raghurajpur village paint using natural pigments (conch shell white, lamp black, chalk) and draw Jagannath stories. Sambalpuri Ikat involves tying yarn before dyeing — the pattern appears only after weaving.',
    visit: 'Raghurajpur Heritage Craft Village near Puri for Pattachitra. Sambalpur for Ikat. Baripada for Dhokra.',
  },
  'Uttar Pradesh': {
    crafts: ['Banarasi silk', 'Chikankari embroidery', 'Zardozi embroidery', 'Brassware', 'Carpet weaving'],
    culture: 'Ancient city of Varanasi (Kashi) — ghats, classical music, Sanskrit learning. Lucknow Nawabi culture and Kathak dance.',
    products: ['Banarasi silk brocade sarees with gold/silver zari', 'Lucknow Chikankari shadow-work embroidery', 'Varanasi brassware lamps and utensils'],
    gi: ['Banarasi Brocades', 'Lucknow Chikankari', 'Bhadohi Carpet'],
    history: 'Banarasi silk weaving dates to the Mughal era. The finest Kadwa brocade can take 6 months for a single saree. Chikankari\'s 32 stitches were supposedly taught by Mughal Emperor Jahangir\'s wife Noor Jahan.',
    visit: 'Varanasi for Banarasi silk and brassware. Lucknow for Chikankari. Bhadohi for carpet weaving.',
  },
  'Madhya Pradesh': {
    crafts: ['Chanderi silk', 'Maheshwari sarees', 'Gond tribal painting', 'Bagh block printing', 'Dhokra'],
    culture: 'Malwa and Bundelkhand royal heritage. Famous for Khajuraho temples, Sanchi Stupa, and tribal Gond culture.',
    products: ['Chanderi silk-cotton lightweight sheer sarees', 'Maheshwari sarees from Queen Ahilyabai\'s court', 'Gond dot-work paintings from forest folklore'],
    gi: ['Chanderi Saree', 'Maheshwari Saree', 'Bagh Print'],
    history: 'Chanderi weaving was started under Sultan Ghiyasuddin Khilji. The fabric is so fine it\'s called "woven air" — a saree can pass through a finger ring. Maheshwari weaving was revived by Queen Ahilyabai Holkar in the 18th century.',
    visit: 'Chanderi town 220 km from Bhopal. Maheshwar on Narmada river. Bagh village for block printing.',
  },
  'Bihar': {
    crafts: ['Madhubani painting', 'Sikki grass craft', 'Sujni embroidery', 'Manjusha art', 'Tikuli art'],
    culture: 'Ancient Magadha Empire, birthplace of Buddhism and Jainism. Chhath Puja sun worship festival. Maithili culture and Mithila art.',
    products: ['Madhubani paintings with geometric and floral motifs', 'Sikki golden grass dolls and baskets', 'Manjusha folk-art boxes painted in Bhagalpur'],
    gi: ['Madhubani Painting', 'Sujni Embroidery'],
    history: 'Madhubani (Mithila) painting was traditionally done on freshly plastered mud walls by women. After the 1934 earthquake, William Archer discovered them and helped artists transition to paper. Natural dyes from plants, minerals and soot are still used.',
    visit: 'Madhubani district — Jitwarpur and Ranti villages. Best visited November–February.',
  },
  'Assam': {
    crafts: ['Muga silk', 'Mekhela chador weaving', 'Cane and bamboo craft', 'Bell metal craft', 'Pani meteka'],
    culture: 'Bihu festival, Sattriya classical dance, tea culture. Diverse tribal heritage — Bodo, Mising, Karbi people.',
    products: ['Muga silk with natural golden sheen (unique to Assam)', 'Mekhela chador two-piece silk ensemble', 'Bamboo and cane furniture and handicrafts'],
    gi: ['Muga Silk', 'Assam Tea', 'Tezpur Litchi'],
    history: 'Muga silk is produced exclusively in Assam from the Antheraea assamensis silkworm that feeds on som and sualu plants. Unlike mulberry silk, Muga is golden-brown and gets more lustrous with age — it can last 100+ years.',
    visit: 'Sualkuchi "Manchester of Assam" for silk weaving, 35 km from Guwahati. Majuli island for bamboo crafts.',
  },
  'Kerala': {
    crafts: ['Coir weaving', 'Aranmula metal mirror', 'Kasavu weaving', 'Kathakali costume craft', 'Wood carving'],
    culture: 'Onam festival, Kathakali and Mohiniyattam dance, Kalaripayattu martial art. Backwaters and spice trade heritage.',
    products: ['Coir rugs, mats and furniture from coconut fibre', 'Aranmula Kannadi metal mirrors (only of their kind)', 'Kasavu off-white sarees with gold border'],
    gi: ['Aranmula Kannadi', 'Coir Products', 'Kasaragod Saree'],
    history: 'Aranmula Kannadi is made from a secret alloy of copper and tin, known only to a handful of families in Aranmula village. Unlike glass mirrors, it reflects without distortion and never tarnishes.',
    visit: 'Aranmula near Pathanamthitta for metal mirrors. Chendamangalam for kasavu weaving. Alleppey for coir.',
  },
  'Jammu & Kashmir': {
    crafts: ['Pashmina shawl', 'Papier-mâché', 'Kashmiri carpet', 'Sozni embroidery', 'Walnut wood carving'],
    culture: 'Himalayan and Central Asian confluence. Sufi music, Rouf dance, Shikara culture on Dal Lake.',
    products: ['Hand-spun Pashmina from Changra goat wool', 'Papier-mâché lacquered decorative boxes', 'Hand-knotted Kashmiri silk and wool carpets'],
    gi: ['Kashmir Pashmina', 'Kashmir Sozni', 'Kashmir Walnut Wood Carving'],
    history: 'Authentic Pashmina comes from the Changra goat of Ladakh that grows extra-fine undercoat at 4000m altitude. The de-hairing, spinning and weaving are all done by hand. A single Pashmina shawl takes 180 hours to make.',
    visit: 'Srinagar — Dal Lake area for carpet and papier-mâché. Leh for Pashmina sourcing.',
  },
  'Punjab': {
    crafts: ['Phulkari embroidery', 'Punjabi Jutti', 'Durrie weaving', 'Shawl weaving', 'Pottery'],
    culture: 'Bhangra and Giddha folk dances, Lohri and Baisakhi festivals. Sikh heritage and langar culture.',
    products: ['Phulkari floral embroidery on hand-spun cotton', 'Handcrafted Punjabi leather juttis with thread work', 'Patiala salwar and phulkari dupatta'],
    gi: ['Phulkari', 'Punjab Basmati', 'Patiala Salwar'],
    history: 'Phulkari (flower work) was traditionally made by Punjabi women for trousseau. The embroidery covers the entire base cloth. Bagh (garden) style covers the fabric completely; Phulkari leaves gaps for the base colour.',
    visit: 'Patiala for phulkari and jutti. Amritsar for shawls and Punjabi craft bazaars.',
  },
  'Himachal Pradesh': {
    crafts: ['Kullu shawls', 'Chamba Rumal', 'Kangra miniature painting', 'Lahauli weaving', 'Wood carving'],
    culture: 'Mountain tribal culture, Dussehra festival in Kullu, Dham feast tradition. Buddhist and Hindu temple heritage.',
    products: ['Kullu shawls with geometric patterns in pure wool', 'Chamba Rumal double-sided embroidery', 'Kangra miniature paintings with natural pigments'],
    gi: ['Kullu Shawl', 'Chamba Rumal', 'Kangra Tea'],
    history: 'Chamba Rumal\'s double-sided embroidery has no wrong side — both faces look identical. It was used to cover ritual offerings in Chamba court. Kullu shawls are woven by women on pit looms using local Angora rabbit and yak wool.',
    visit: 'Kullu Valley for shawl weaving. Chamba town 200 km from Shimla for Rumal. Kangra for miniature painting.',
  },
};

const CRAFT_FAQS = [
  { q: /gi tag|geographical indication/i, a: 'GI (Geographical Indication) tags protect traditional products from a specific region. India has 500+ GI-tagged crafts. CraftTrail verifies artisans against the official GI registry before issuing a Pehchan card.' },
  { q: /book|workshop|visit/i, a: 'You can book workshops directly on CraftTrail! Create a free account, find an artisan, and click "Request a visit." The artisan confirms via WhatsApp before anything is charged. 95% of the booking amount goes directly to the artisan.' },
  { q: /pehchan|verified|trust|badge/i, a: 'CraftTrail\'s 3-tier trust system: Tier 1 (OCR reads the Pehchan/GI card and verifies the craft against the GI registry — score up to 40), Tier 2 (an SHG/cooperative vouches in person — score up to 60), Tier 3 (verified by real visitor reviews — up to 100). A score of 60+ means the artisan has been physically verified.' },
  { q: /price|cost|how much/i, a: 'Workshop prices vary by artisan and craft. Most 2-3 hour workshops range from ₹500 to ₹3,000 per person. You can see the exact price on each artisan\'s profile page before booking.' },
  { q: /how to find|nearest|near me/i, a: 'Use the CraftTrail map on the Discover page. Allow location access and the map shows all craft clusters within 150 km of you. You can filter by craft type and sort by distance or availability.' },
  { q: /contact|whatsapp/i, a: 'CraftTrail uses WhatsApp for artisan availability — the channel artisans already use. You don\'t need to manage another app. Send a visit request and the artisan responds on WhatsApp.' },
  { q: /certificate/i, a: 'After completing a workshop visit, CraftTrail issues a digital certificate with a unique QR code. It\'s a permanent proof that you visited a verified artisan — shareable as a link forever.' },
];

function FallbackChat({ context, artisanName, stateName }) {
  const [messages, setMessages] = useState([
    {
      role: 'bot',
      text: `Namaste! 🙏 I'm CraftBot, your Indian craft guide.${
        artisanName ? ` I can tell you all about **${artisanName}**'s workshop, craft techniques, and how to book a visit.` :
        stateName ? ` I know all about **${stateName}**'s heritage crafts, culture, products, and the best places to visit.` :
        " Ask me anything about India's 3,000+ craft traditions, artisan verification, booking workshops, or planning a craft village visit!"
      }`,
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const answer = (q) => {
    const lq = q.toLowerCase();

    // State-specific answers
    if (stateName && STATE_KNOWLEDGE[stateName]) {
      const info = STATE_KNOWLEDGE[stateName];
      if (/craft|make|produc|item|textile|weav/i.test(lq)) {
        return `**${stateName}'s major crafts:**\n${info.crafts.map(c => `• ${c}`).join('\n')}\n\n**Notable products:** ${info.products.slice(0, 2).join(', ')}.`;
      }
      if (/culture|tradition|festival|dance|music|histor/i.test(lq)) {
        return `**${stateName} Culture & Heritage:**\n\n${info.culture}\n\n**Historical background:** ${info.history}`;
      }
      if (/gi|geographical indication|protect/i.test(lq)) {
        return `**${stateName} GI-tagged crafts:** ${info.gi.join(', ')}.\n\nThese products are legally protected — only artisans from the registered regions can sell under these names. CraftTrail verifies all artisans against the official GI registry.`;
      }
      if (/visit|where|go|travel|cluster/i.test(lq)) {
        return `**Visiting ${stateName}:**\n\n${info.visit}\n\nAll craft clusters are mapped on CraftTrail's Discover page. Use the map to find artisans within 150 km of your location.`;
      }
      if (/product|buy|purchase|price/i.test(lq)) {
        return `**${stateName} craft products:**\n${info.products.map(p => `• ${p}`).join('\n')}\n\nYou can book workshop visits directly with verified artisans on CraftTrail.`;
      }
      // Default state answer
      return `**${stateName} Craft Heritage:**\n\n${info.history}\n\n**Key crafts:** ${info.crafts.slice(0, 3).join(', ')}.\n\n**Culture:** ${info.culture.slice(0, 150)}…\n\nAsk me about crafts, culture, GI tags, or visiting!`;
    }

    // Artisan-specific with context
    if (artisanName && context) {
      if (/craft|make|specializ|work/i.test(lq)) {
        const lines = context.split('\n').filter(l => /craft|specializ|skill/i.test(l));
        return lines.length ? lines.join('\n') : `${artisanName} is a verified artisan on CraftTrail. Check their profile for craft details.`;
      }
    }

    // FAQ matching
    for (const faq of CRAFT_FAQS) {
      if (faq.q.test(lq)) return faq.a;
    }

    // State lookup from question
    for (const [state, info] of Object.entries(STATE_KNOWLEDGE)) {
      if (lq.includes(state.toLowerCase())) {
        return `**${state}** is known for: ${info.crafts.slice(0, 3).join(', ')}.\n\n${info.history.slice(0, 200)}…\n\nAsk me more about its culture, products, GI tags, or visiting!`;
      }
    }

    // Generic craft knowledge
    if (/ikat/i.test(lq)) return 'Ikat is a dyeing technique where threads are resist-dyed before weaving. India has two major centres: Pochampally (Telangana) for warp Ikat and Sambalpur (Odisha) for weft Ikat. Patan (Gujarat) makes the rarest — double Ikat where both warp and weft are dyed.';
    if (/silk/i.test(lq)) return 'India produces 5 major types of silk: Mulberry (Kanchipuram, Mysore, Banarasi), Muga (Assam — golden), Tasar (Jharkhand, Odisha), Eri (Northeast), and Tussar. Kanchipuram and Banarasi are the most celebrated.';
    if (/natural dye|organic/i.test(lq)) return 'Traditional Indian crafts use natural dyes: indigo (blue), turmeric (yellow), henna (orange), pomegranate rind (yellow-brown), madder root (red), and iron-rich mud (black). Natural dyes are making a comeback in eco-conscious craft clusters.';
    if (/how many|number|how much|statistic/i.test(lq)) return 'India has 3,000+ distinct craft forms, 744 government-recognised handicraft clusters, and 64.66 lakh (6.5 million) artisans — 64% of them women. There are 500+ GI-tagged products, but almost none of this is easily discoverable online — which is why CraftTrail was built.';

    return `Great question! I can help with:\n• **Craft traditions** of any Indian state\n• **Cultural heritage** and festivals\n• **Products & GI tags** from each region\n• **Booking workshops** with verified artisans\n• **Planning visits** to craft villages\n\nTry asking: "Tell me about Rajasthan's crafts" or "How do I book a workshop?"`;
  };

  const send = () => {
    const q = input.trim();
    if (!q) return;
    setMessages(prev => [...prev, { role: 'user', text: q }]);
    setInput('');
    setBusy(true);
    setTimeout(() => {
      const resp = answer(q);
      setMessages(prev => [...prev, { role: 'bot', text: resp }]);
      setBusy(false);
    }, 600 + Math.random() * 400);
  };

  const renderText = (text) => {
    // Simple markdown-like renderer
    return text.split('\n').map((line, i) => {
      const bold = line.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
      if (line.startsWith('• ')) return <li key={i} dangerouslySetInnerHTML={{ __html: bold.slice(2) }} />;
      if (line === '') return <br key={i} />;
      return <p key={i} dangerouslySetInnerHTML={{ __html: bold }} />;
    });
  };

  return (
    <div className="cbot__fallback">
      <div className="cbot__fb-head">
        <div className="cbot__fb-avatar">🤖</div>
        <div>
          <div className="cbot__fb-name">CraftBot AI</div>
          <div className="cbot__fb-sub">India's craft & artisan guide</div>
        </div>
        <div className="cbot__fb-status">
          <span className="cbot__fb-dot" />
          Online
        </div>
      </div>

      <div className="cbot__fb-messages">
        {messages.map((m, i) => (
          <div key={i} className={`cbot__fb-msg cbot__fb-msg--${m.role}`}>
            {m.role === 'bot' && <span className="cbot__fb-icon">🪷</span>}
            <div className="cbot__fb-bubble">
              {renderText(m.text)}
            </div>
          </div>
        ))}
        {busy && (
          <div className="cbot__fb-msg cbot__fb-msg--bot">
            <span className="cbot__fb-icon">🪷</span>
            <div className="cbot__fb-bubble cbot__fb-typing">
              <span /><span /><span />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="cbot__fb-input">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={stateName ? `Ask about ${stateName}…` : artisanName ? `Ask about ${artisanName}…` : 'Ask about Indian crafts…'}
          disabled={busy}
        />
        <button onClick={send} disabled={busy || !input.trim()} aria-label="Send">
          <svg viewBox="0 0 24 24" fill="none">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            <path d="M22 2L15 22 11 13 2 9l20-7z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div className="cbot__fb-footer">
        Powered by CraftTrail AI • Knowledge Base: 16 Indian States • 500+ GI Crafts
      </div>
    </div>
  );
}

export default FallbackChat;
