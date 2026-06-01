import 'dotenv/config';
import * as admin from 'firebase-admin';

const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID!,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL!,
  privateKey: process.env.FIREBASE_PRIVATE_KEY!.replace(/\\n/g, '\n'),
};

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

const KEEP_COLLECTIONS = new Set(['config'])

async function deleteSubcollections(docRef: admin.firestore.DocumentReference): Promise<number> {
  const collections = await docRef.listCollections()
  let total = 0

  for (const col of collections) {
    const snapshot = await col.get()
    for (const doc of snapshot.docs) {
      total += await deleteSubcollections(doc.ref)
      await doc.ref.delete()
      total++
    }
  }

  return total
}

async function cleanCollection(collectionId: string): Promise<number> {
  if (KEEP_COLLECTIONS.has(collectionId)) {
    console.log(`  ↪ Saltando ${collectionId} (protegida)`)
    return 0
  }

  const colRef = db.collection(collectionId)
  const snapshot = await colRef.get()
  let total = 0

  if (snapshot.empty) {
    console.log(`  ↪ ${collectionId} ya está vacía`)
    return 0
  }

  for (const doc of snapshot.docs) {
    total += await deleteSubcollections(doc.ref)
    await doc.ref.delete()
    total++
  }

  console.log(`  ✓ ${collectionId}: ${snapshot.size} documento(s) + ${total - snapshot.size} subdocumento(s) eliminados`)
  return total
}

async function cleanDatabase() {
  console.log('\n🧹 Limpiando base de datos (bancos incluidos, config protegida)...\n')

  const collections = await db.listCollections()
  const total: Record<string, number> = {}

  for (const col of collections) {
    const count = await cleanCollection(col.id)
    total[col.id] = count
  }

  const grandTotal = Object.values(total).reduce((s, v) => s + v, 0)
  console.log(`\n✅ Limpieza completada. Total: ${grandTotal} documentos eliminados.\n`)
}

cleanDatabase()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error:', err)
    process.exit(1)
  })
