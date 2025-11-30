/**
 * Agri360 - API Test Script
 * Tests the main endpoints with sample data
 */

const BASE_URL = process.env.TEST_BASE_URL || "http://localhost:5000";

// Test data
const testUser = {
  name: "Test Farmer",
  email: `test_${Date.now()}@example.com`,
  password: "password123",
  role: "farmer",
  governorate: "kafr_el_sheikh",
};

const testFarm = {
  name: "Test Farm",
  location: {
    lat: 31.1107,
    lon: 30.9388,
    governorate: "kafr_el_sheikh",
    address: "Kafr El Sheikh, Egypt",
  },
  fieldSizeHectares: 5,
  soil: {
    ph: 7.8,
    soilType: "clay",
  },
  water: {
    source: "canal",
    irrigationType: "flood",
    availableM3PerMonth: 5000,
  },
};

let authToken = null;
let farmId = null;
let userId = null;

async function makeRequest(method, path, body = null) {
  const headers = {
    "Content-Type": "application/json",
  };
  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  const options = {
    method,
    headers,
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(`${BASE_URL}${path}`, options);
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

async function runTests() {
  console.log("🧪 Starting Agri360 API Tests\n");
  console.log(`📍 Base URL: ${BASE_URL}\n`);

  // Test 1: Health Check
  console.log("1️⃣ Testing Health Check...");
  const health = await makeRequest("GET", "/");
  console.log(`   Status: ${health.status}`);
  if (health.status === 200) {
    console.log(`   ✅ Server is running: ${health.data}\n`);
  } else {
    console.log(`   ❌ Server not responding: ${health.error}\n`);
    return;
  }

  // Test 2: Register User
  console.log("2️⃣ Testing User Registration...");
  const register = await makeRequest("POST", "/api/auth/register", testUser);
  console.log(`   Status: ${register.status}`);
  if (register.status === 201 || register.status === 200) {
    authToken = register.data?.token;
    userId = register.data?.user?.id || register.data?.user?._id;
    console.log(`   ✅ User registered successfully\n`);
  } else {
    console.log(
      `   ⚠️ Registration response: ${JSON.stringify(
        register.data || register.error
      )}\n`
    );
    // Try login if user already exists
    console.log("   Trying login instead...");
    const login = await makeRequest("POST", "/api/auth/login", {
      email: testUser.email,
      password: testUser.password,
    });
    console.log(`   Login status: ${login.status}`);
    if (login.data?.token) {
      authToken = login.data.token;
      userId = login.data.user?.id || login.data.user?._id;
      console.log(`   ✅ Login successful\n`);
    } else {
      console.log(
        `   ⚠️ Login also failed: ${JSON.stringify(
          login.data || login.error
        )}\n`
      );
      console.log("   Continuing without authentication...\n");
    }
  }

  // Test 3: Create Farm (if authenticated)
  if (authToken) {
    console.log("3️⃣ Testing Farm Creation...");
    const farmCreate = await makeRequest("POST", "/api/farms", testFarm);
    console.log(`   Status: ${farmCreate.status}`);
    if (farmCreate.status === 201 || farmCreate.status === 200) {
      farmId = farmCreate.data?.farm?._id || farmCreate.data?._id;
      console.log(`   ✅ Farm created: ${farmId}\n`);
    } else {
      console.log(
        `   ⚠️ Farm response: ${JSON.stringify(
          farmCreate.data || farmCreate.error
        )}\n`
      );
    }
  } else {
    console.log("3️⃣ Skipping Farm Creation (no auth token)\n");
  }

  // Test 4: Chat (simple) - doesn't require auth for basic chat
  console.log("4️⃣ Testing Chat (simple)...");
  const chat = await makeRequest("POST", "/api/chat", {
    message: "What crops grow best in clay soil in Egypt?",
    mode: "chat",
  });
  console.log(`   Status: ${chat.status}`);
  if (chat.status === 200) {
    console.log(`   ✅ Chat response received`);
    const reply =
      chat.data?.reply || chat.data?.message || JSON.stringify(chat.data);
    console.log(`   Reply: ${reply?.substring(0, 200)}...\n`);
  } else {
    console.log(
      `   ⚠️ Chat response: ${JSON.stringify(chat.data || chat.error)}\n`
    );
  }

  // Test 5: Get Market Prices
  console.log("5️⃣ Testing Market Prices...");
  const prices = await makeRequest("GET", "/api/market");
  console.log(`   Status: ${prices.status}`);
  if (prices.status === 200) {
    const listings = prices.data?.listings || prices.data;
    console.log(
      `   ✅ Market data retrieved: ${
        Array.isArray(listings) ? listings.length + " items" : "OK"
      }\n`
    );
  } else {
    console.log(
      `   ⚠️ Market response: ${JSON.stringify(prices.data || prices.error)}\n`
    );
  }

  // Test 6: Create Business Plan (this will use the AI agent)
  if (farmId) {
    console.log("6️⃣ Testing Business Plan Creation (AI Agent)...");
    console.log("   ⏳ This may take a minute as AI processes data...");
    const businessPlan = await makeRequest("POST", "/api/business", {
      farmId,
      crop: "wheat",
      planDurationMonths: 6,
      marketStrategy: "local",
    });
    console.log(`   Status: ${businessPlan.status}`);
    if (businessPlan.status === 201 || businessPlan.status === 200) {
      console.log(`   ✅ Business plan created!`);
      const summary =
        businessPlan.data?.businessPlan?.aiAdvice?.summary ||
        businessPlan.data?.summary ||
        "Plan generated";
      console.log(`   Summary: ${summary.substring(0, 150)}...\n`);
    } else {
      console.log(
        `   ⚠️ Business plan response: ${JSON.stringify(
          businessPlan.data || businessPlan.error
        ).substring(0, 300)}\n`
      );
    }
  } else {
    console.log("6️⃣ Skipping Business Plan (no farm created)\n");
  }

  // Test 7: Create Harvest Plan (this will use the AI agent)
  if (farmId) {
    console.log("7️⃣ Testing Harvest Plan Creation (AI Agent)...");
    console.log("   ⏳ This may take a minute as AI processes data...");
    const harvestPlan = await makeRequest("POST", "/api/harvests", {
      farmId,
      targetCrops: ["wheat", "rice", "cotton"],
      prioritize: "profit",
    });
    console.log(`   Status: ${harvestPlan.status}`);
    if (harvestPlan.status === 201 || harvestPlan.status === 200) {
      console.log(`   ✅ Harvest plan created!`);
      const crop = harvestPlan.data?.plan?.crop || "recommended";
      const summary =
        harvestPlan.data?.plan?.aiNotes?.summary ||
        harvestPlan.data?.summary ||
        "Plan generated";
      console.log(`   Recommended crop: ${crop}`);
      console.log(`   Summary: ${summary.substring?.(0, 150) || summary}...\n`);
    } else {
      console.log(
        `   ⚠️ Harvest plan response: ${JSON.stringify(
          harvestPlan.data || harvestPlan.error
        ).substring(0, 300)}\n`
      );
    }
  } else {
    console.log("7️⃣ Skipping Harvest Plan (no farm created)\n");
  }

  console.log("✅ All tests completed!\n");
}

runTests().catch(console.error);
