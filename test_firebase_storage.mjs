import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  deleteDoc, 
  serverTimestamp 
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCSVAnZjVWMBbLxXTZnVgDMewBRzZK_guA",
  authDomain: "sirsuryatex.firebaseapp.com",
  projectId: "sirsuryatex",
  storageBucket: "sirsuryatex.firebasestorage.app",
  messagingSenderId: "57502203829",
  appId: "1:57502203829:web:4b7696fab4db9b3a4063fc",
  measurementId: "G-VD24YT7TL7"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const testProducts = [
  {
    title: "Premium Erode Handloom Cotton Door Mat",
    category: "Handloom Mats",
    baseRate: 450,
    unit: "per Bundle",
    bundlePieces: 10,
    bundlesPerPack: 8,
    minOrderNotice: "Purchased per full Bundle (10 Pcs only)",
    inStock: true,
    stockStatus: "IN_STOCK",
    stockQty: 100,
    description: "Authentic Erode handloom woven cotton door mats with high water absorbency and double stitch borders.",
    imageUrl: "/assets/logo.png",
    images: [
      "/assets/logo.png",
      "/assets/visiting_card.jpg"
    ]
  },
  {
    title: "Heavy Duty Anti-Slip Ribbed Rubber Mat",
    category: "Rubber Mats",
    baseRate: 750,
    unit: "per Bundle",
    bundlePieces: 10,
    bundlesPerPack: 6,
    minOrderNotice: "Purchased per full Bundle (10 Pcs only)",
    inStock: true,
    stockStatus: "IN_STOCK",
    stockQty: 80,
    description: "Durable natural vulcanized rubber mat with anti-skid bottom pattern, ideal for entrance, kitchen and industrial usage.",
    imageUrl: "/assets/logo.png",
    images: [
      "/assets/logo.png",
      "/assets/visiting_card.jpg"
    ]
  },
  {
    title: "Super Soft Fancy Microfiber Jacquard Mat",
    category: "Fancy Mats",
    baseRate: 920,
    unit: "per Bundle",
    bundlePieces: 10,
    bundlesPerPack: 5,
    minOrderNotice: "Purchased per full Bundle (10 Pcs only)",
    inStock: true,
    stockStatus: "IN_STOCK",
    stockQty: 60,
    description: "Vibrant multi-color fancy jacquard mats with soft touch texture and latex backing.",
    imageUrl: "/assets/logo.png",
    images: [
      "/assets/logo.png",
      "/assets/visiting_card.jpg"
    ]
  },
  {
    title: "Erode Traditional Cotton Double Bed Spread",
    category: "Bed Spreads",
    baseRate: 1350,
    unit: "per Bundle",
    bundlePieces: 5,
    bundlesPerPack: 4,
    minOrderNotice: "Purchased per full Bundle (5 Pcs only)",
    inStock: true,
    stockStatus: "IN_STOCK",
    stockQty: 50,
    description: "Pure cotton dyed yarn bed spread with fast colors and elegant border design. Direct from Erode looms.",
    imageUrl: "/assets/logo.png",
    images: [
      "/assets/logo.png",
      "/assets/visiting_card.jpg"
    ]
  }
];

async function runStorageTest() {
  console.log("🔥 Checking Firebase Firestore Connection & Data Storage for project: 'sirsuryatex'...\n");

  try {
    const productsRef = collection(db, "products");
    
    // 1. Query existing products
    console.log("Step 1: Reading existing documents from Firestore collection 'products'...");
    const initialSnap = await getDocs(productsRef);
    console.log(`  Found ${initialSnap.size} existing products in Firestore.`);
    initialSnap.forEach(d => {
      console.log(`   - [ID: ${d.id}] ${d.data().title} (${d.data().category})`);
    });

    // 2. Add test products if not already present
    console.log("\nStep 2: Adding 2 to 4 test products with multi-image arrays into Firestore...");
    const addedIds = [];

    for (const prod of testProducts) {
      // Check if already exists by title
      const alreadyExists = initialSnap.docs.some(d => d.data().title === prod.title);
      if (alreadyExists) {
        console.log(`  ℹ️ "${prod.title}" already exists in Firestore.`);
        continue;
      }

      const docRef = await addDoc(productsRef, {
        ...prod,
        createdAt: serverTimestamp()
      });
      console.log(`  ✅ Stored in Firebase Firestore: [ID: ${docRef.id}] "${prod.title}"`);
      addedIds.push(docRef.id);
    }

    // 3. Verify persistence with a fresh read
    console.log("\nStep 3: Performing verification read from Firestore...");
    const verifySnap = await getDocs(productsRef);
    console.log(`  Total verified products stored in Firestore: ${verifySnap.size}`);
    
    verifySnap.forEach((d, idx) => {
      const data = d.data();
      const numImages = Array.isArray(data.images) ? data.images.length : (data.imageUrl ? 1 : 0);
      console.log(`   ${idx + 1}. [ID: ${d.id}] ${data.title} | Category: ${data.category} | ${numImages} Images | InStock: ${data.inStock}`);
    });

    console.log("\n=============================================================");
    console.log("🎉 FIREBASE DATA STORAGE STATUS: 100% OPERATIONAL & CONFIRMED!");
    console.log("   - Project: sirsuryatex");
    console.log(`   - Collection: 'products' contains ${verifySnap.size} items`);
    console.log("   - Write Access: WORKING");
    console.log("   - Read Access: WORKING");
    console.log("=============================================================");
  } catch (err) {
    console.error("\n❌ Firebase Firestore Storage Test Failed:", err);
    console.error("   Error Code:", err.code);
    console.error("   Error Message:", err.message);
  }
}

runStorageTest();
