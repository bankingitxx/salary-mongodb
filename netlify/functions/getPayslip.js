const { MongoClient } = require("mongodb");

// ดึง Connection String จากการตั้งค่า Environment ของ Netlify (เพื่อความปลอดภัย)
const uri = process.env.MONGODB_URI;

let cachedClient = null;

async function connectToDatabase() {
  if (cachedClient) {
    return cachedClient;
  }
  const client = new MongoClient(uri);
  await client.connect();
  cachedClient = client;
  return client;
}

exports.handler = async (event, context) => {
  // อนุญาตให้เรียกใช้ข้ามโดเมนได้ (CORS)
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };

  // รับค่าที่ส่งมาจากหน้าเว็บ (Query Parameters)
  const { idcard, year, month } = event.queryStringParameters;

  if (!idcard || !year || !month) {
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: "ส่งข้อมูลไม่ครบ (idcard, year, month)" }),
    };
  }

  try {
    const client = await connectToDatabase();
    // เข้าถึง Database ชื่อ "Slips" และ Collection ชื่อ "Slips"
    const database = client.db("Slips");
    const collection = database.collection("Slips");

    // ค้นหาข้อมูล (แปลง year/month เป็นตัวเลขเพื่อให้ตรงกับ Type ใน DB)
    const query = {
      "เลขประจำตัวประชาชน": idcard, // ชื่อ field ต้องตรงกับใน MongoDB เป๊ะๆ
      "year": parseInt(year),
      "month": parseInt(month)
    };

    const result = await collection.findOne(query);

    if (!result) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ error: "ไม่พบข้อมูลสลิปเงินเดือน" }),
      };
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result),
    };

  } catch (error) {
    console.error("Database Error:", error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล" }),
    };
  }
};