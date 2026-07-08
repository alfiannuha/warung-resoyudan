/**
 * Mock barcode product lookup service.
 *
 * Simulates fetching product details from an external barcode database (e.g. EAN database).
 * In production, replace with actual API call to a barcode lookup service.
 */

export interface BarcodeLookupResult {
  name: string;
  category: string;
  brand?: string;
}

// Common Indonesian retail products keyed by barcode
const barcodeDB: Record<string, BarcodeLookupResult> = {
  // Indofood products
  "8991002101234": { name: "Beras Ramos 5kg", category: "Sembako", brand: "Indofood" },
  "8991002104567": { name: "Minyak Goreng Bimoli 1L", category: "Sembako", brand: "Indofood" },
  "8991002107890": { name: "Gula Pasir Gulaku 1kg", category: "Sembako", brand: "Gulaku" },
  "8991002110123": { name: "Kopi Kapal Api Sachet", category: "Minuman", brand: "Kapal Api" },
  "8991002113456": { name: "Indomie Goreng", category: "Makanan", brand: "Indomie" },
  "8991002116789": { name: "Kecap Manis ABC Botol 275ml", category: "Kebutuhan Rumah", brand: "ABC" },
  "8991002120123": { name: "Saos Sambal ABC Botol 275ml", category: "Kebutuhan Rumah", brand: "ABC" },
  "8991002123456": { name: "Garam Halus Refina 250g", category: "Sembako", brand: "Refina" },
  "8991002126789": { name: "Tepung Terigu Segitiga Biru 1kg", category: "Sembako", brand: "Bogasari" },
  "8991002130123": { name: "Sabun Cuci Piring Sunlight 450ml", category: "Kebutuhan Rumah", brand: "Sunlight" },
  "8991002133456": { name: "Shampoo Lifebuoy Sachet", category: "Kebutuhan Rumah", brand: "Lifebuoy" },
  "8991002136789": { name: "Rokok Surya Gudang Garam 12", category: "Rokok", brand: "Gudang Garam" },
  "8991002140123": { name: "Biskuit Roma Kelapa", category: "Makanan", brand: "Roma" },
  "8991002143456": { name: "Susu Kental Manis Frisian Flag", category: "Minuman", brand: "Frisian Flag" },

  // Additional common products
  "8998866200103": { name: "Teh Botol Sosro 500ml", category: "Minuman", brand: "Sosro" },
  "8998866200127": { name: "Teh Botol Sosro 200ml", category: "Minuman", brand: "Sosro" },
  "8998866200134": { name: "Fruit Tea Apel 500ml", category: "Minuman", brand: "Sosro" },
  "8991002124563": { name: "Mie Sedaap Goreng", category: "Makanan", brand: "Mie Sedaap" },
  "8991002124570": { name: "Mie Sedaap Soto", category: "Makanan", brand: "Mie Sedaap" },
  "8991002114563": { name: "Indomie Kuah Rendang", category: "Makanan", brand: "Indomie" },
  "8991002114570": { name: "Indomie Kuah Kari Ayam", category: "Makanan", brand: "Indomie" },
  "8995899100015": { name: "Aqua 600ml", category: "Minuman", brand: "Aqua" },
  "8995899100022": { name: "Aqua 1500ml", category: "Minuman", brand: "Aqua" },
  "8995899100039": { name: "Aqua 330ml", category: "Minuman", brand: "Aqua" },
  "8992696100114": { name: "Coca-Cola 390ml", category: "Minuman", brand: "Coca-Cola" },
  "8992696100121": { name: "Sprite 390ml", category: "Minuman", brand: "Sprite" },
  "8992696100138": { name: "Fanta 390ml", category: "Minuman", brand: "Fanta" },
  "8992761100016": { name: "Silver Queen 62g", category: "Makanan", brand: "Silver Queen" },
  "8992761100023": { name: "Beng-Beng 40g", category: "Makanan", brand: "Beng-Beng" },
  "8991102103125": { name: "Kacang Dua Kelinci 250g", category: "Makanan", brand: "Dua Kelinci" },
  "8991102103132": { name: "Kacang Dua Kelinci 500g", category: "Makanan", brand: "Dua Kelinci" },
  "8993175112099": { name: "Nuvo Family 135g", category: "Kebutuhan Rumah", brand: "Nuvo" },
  "8993175113133": { name: "Lifebuoy Sabun Batang 100g", category: "Kebutuhan Rumah", brand: "Lifebuoy" },
  "8999909050734": { name: "Pepsodent Pasta Gigi 75g", category: "Kebutuhan Rumah", brand: "Pepsodent" },
  "8999909050741": { name: "Pepsodent Pasta Gigi 120g", category: "Kebutuhan Rumah", brand: "Pepsodent" },
  "8999909050758": { name: "Close Up Pasta Gigi 100g", category: "Kebutuhan Rumah", brand: "Close Up" },
  "8997201100169": { name: "Super Pel 800ml", category: "Kebutuhan Rumah", brand: "Super Pel" },
  "8997201100176": { name: "So Klin Pewangi 800ml", category: "Kebutuhan Rumah", brand: "So Klin" },
  "8997201100183": { name: "RINSO Deterjen 900g", category: "Kebutuhan Rumah", brand: "RINSO" },
  "8997201100190": { name: "Dawn Sabun Cuci Piring 650ml", category: "Kebutuhan Rumah", brand: "Dawn" },
  "8997201100206": { name: "Mama Lemon 800ml", category: "Kebutuhan Rumah", brand: "Mama Lemon" },
  "8998691314723": { name: "Taro Net 100g", category: "Makanan", brand: "Taro" },
  "8998691314730": { name: "Qtela 115g", category: "Makanan", brand: "Qtela" },
  "8998691314747": { name: "Chitato 68g", category: "Makanan", brand: "Chitato" },
  "8998691314754": { name: "Lays 68g", category: "Makanan", brand: "Lays" },
  "8998691314761": { name: "Doritos 68g", category: "Makanan", brand: "Doritos" },
};

/**
 * Look up product details by barcode.
 * Simulates a 200-400ms network delay.
 */
export async function lookupBarcode(barcode: string): Promise<BarcodeLookupResult | null> {
  // Simulate network latency
  await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));

  return barcodeDB[barcode] || null;
}
