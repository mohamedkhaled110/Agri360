"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import api from "@/lib/api"

interface TestResult {
  name: string
  status: "pending" | "loading" | "success" | "error"
  response?: any
  error?: string
  timestamp?: Date
}

export default function TestAPIPage() {
  const [results, setResults] = useState<TestResult[]>([])
  const [testEmail, setTestEmail] = useState("test" + Date.now() + "@example.com")
  const [testPassword, setTestPassword] = useState("password123")
  const [token, setToken] = useState<string | null>(null)
  const [userId, setUserId] = useState<string | null>(null)
  const [farmId, setFarmId] = useState<string | null>(null)

  const addResult = (result: TestResult) => {
    setResults((prev) => [...prev, { ...result, timestamp: new Date() }])
  }

  const clearResults = () => setResults([])

  // Test Backend Health
  const testBackendHealth = async () => {
    addResult({ name: "Testing Backend Health", status: "loading" })
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'
      const res = await fetch(`${API_URL}/test-api`)
      const data = await res.json()
      addResult({
        name: "✅ Backend Health",
        status: "success",
        response: data,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Backend Health",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Auth - Register
  const testRegister = async () => {
    const testName = `Test User ${Date.now()}`
    addResult({ name: "Testing Register", status: "loading" })
    try {
      const res = await api.auth.register({
        name: testName,
        email: testEmail,
        password: testPassword,
      })
      setToken(res.token)
      setUserId(res.user?._id)
      addResult({
        name: "✅ Register",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Register",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Auth - Login
  const testLogin = async () => {
    addResult({ name: "Testing Login", status: "loading" })
    try {
      const res = await api.auth.login({
        email: testEmail,
        password: testPassword,
      })
      setToken(res.token)
      setUserId(res.user?._id)
      localStorage.setItem("token", res.token)
      addResult({
        name: "✅ Login",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Login",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Auth - Me
  const testAuthMe = async () => {
    if (!token) {
      addResult({
        name: "⚠️ Auth Me",
        status: "error",
        error: "No token available. Login first.",
      })
      return
    }
    addResult({ name: "Testing Auth Me", status: "loading" })
    try {
      const res = await api.auth.me()
      addResult({
        name: "✅ Auth Me",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Auth Me",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test User - Get Profile
  const testGetProfile = async () => {
    if (!token) {
      addResult({
        name: "⚠️ Get Profile",
        status: "error",
        error: "No token available. Login first.",
      })
      return
    }
    addResult({ name: "Testing Get Profile", status: "loading" })
    try {
      const res = await api.user.getProfile()
      addResult({
        name: "✅ Get Profile",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Get Profile",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test User - Update Profile
  const testUpdateProfile = async () => {
    if (!token) {
      addResult({
        name: "⚠️ Update Profile",
        status: "error",
        error: "No token available. Login first.",
      })
      return
    }
    addResult({ name: "Testing Update Profile", status: "loading" })
    try {
      const res = await api.user.updateProfile({
        country: "Egypt",
        governorate: "Cairo",
      })
      addResult({
        name: "✅ Update Profile",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Update Profile",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Farm - Create
  const testCreateFarm = async () => {
    if (!token) {
      addResult({
        name: "⚠️ Create Farm",
        status: "error",
        error: "No token available. Login first.",
      })
      return
    }
    addResult({ name: "Testing Create Farm", status: "loading" })
    try {
      const res = await api.farms.create({
        name: `Test Farm ${Date.now()}`,
        location: "Cairo",
        area: 100,
      })
      setFarmId(res._id)
      addResult({
        name: "✅ Create Farm",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Create Farm",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Farm - Get Farm
  const testGetFarm = async () => {
    if (!token || !farmId) {
      addResult({
        name: "⚠️ Get Farm",
        status: "error",
        error: "No token or farm ID available. Create a farm first.",
      })
      return
    }
    addResult({ name: "Testing Get Farm", status: "loading" })
    try {
      const res = await api.farms.getFarm(farmId)
      addResult({
        name: "✅ Get Farm",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Get Farm",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Farm - Analyze Soil
  const testAnalyzeSoil = async () => {
    if (!token) {
      addResult({
        name: "⚠️ Analyze Soil",
        status: "error",
        error: "No token available. Login first.",
      })
      return
    }
    addResult({ name: "Testing Analyze Soil", status: "loading" })
    try {
      const res = await api.farms.analyzeSoil({
        farmId: farmId || "test",
        soilType: "clay",
        ph: 7.5,
      })
      addResult({
        name: "✅ Analyze Soil",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Analyze Soil",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Harvest - Create
  const testCreateHarvest = async () => {
    if (!token) {
      addResult({
        name: "⚠️ Create Harvest",
        status: "error",
        error: "No token available. Login first.",
      })
      return
    }
    addResult({ name: "Testing Create Harvest", status: "loading" })
    try {
      const res = await api.harvest.create({
        farmId: farmId || "test",
        crop: "Wheat",
        plantDate: new Date().toISOString(),
        expectedHarvestDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString(),
      })
      addResult({
        name: "✅ Create Harvest",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Create Harvest",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Harvest - List
  const testListHarvests = async () => {
    if (!token) {
      addResult({
        name: "⚠️ List Harvests",
        status: "error",
        error: "No token available. Login first.",
      })
      return
    }
    addResult({ name: "Testing List Harvests", status: "loading" })
    try {
      const res = await api.harvest.list()
      addResult({
        name: "✅ List Harvests",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ List Harvests",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Business Plan - Create
  const testCreateBusinessPlan = async () => {
    if (!token) {
      addResult({
        name: "⚠️ Create Business Plan",
        status: "error",
        error: "No token available. Login first.",
      })
      return
    }
    addResult({ name: "Testing Create Business Plan", status: "loading" })
    try {
      const res = await api.businessPlan.create({
        name: `Test Plan ${Date.now()}`,
        farmId: farmId || "test",
        budget: 10000,
      })
      addResult({
        name: "✅ Create Business Plan",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Create Business Plan",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Business Plan - List
  const testListBusinessPlans = async () => {
    if (!token) {
      addResult({
        name: "⚠️ List Business Plans",
        status: "error",
        error: "No token available. Login first.",
      })
      return
    }
    addResult({ name: "Testing List Business Plans", status: "loading" })
    try {
      const res = await api.businessPlan.list()
      addResult({
        name: "✅ List Business Plans",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ List Business Plans",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Dashboard - Get Stats
  const testDashboardStats = async () => {
    if (!token) {
      addResult({
        name: "⚠️ Dashboard Stats",
        status: "error",
        error: "No token available. Login first.",
      })
      return
    }
    addResult({ name: "Testing Dashboard Stats", status: "loading" })
    try {
      const res = await api.dashboard.getStats()
      addResult({
        name: "✅ Dashboard Stats",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Dashboard Stats",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Marketplace - List Listings
  const testListListings = async () => {
    addResult({ name: "Testing List Listings", status: "loading" })
    try {
      const res = await api.marketplace.listListings()
      addResult({
        name: "✅ List Listings",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ List Listings",
        status: "error",
        error: err.message,
      })
    }
  }

  // Test Chat - Send Message
  const testChatSend = async () => {
    if (!token) {
      addResult({
        name: "⚠️ Chat Send",
        status: "error",
        error: "No token available. Login first.",
      })
      return
    }
    addResult({ name: "Testing Chat Send", status: "loading" })
    try {
      const res = await api.chat.send("What should I plant in winter?")
      addResult({
        name: "✅ Chat Send",
        status: "success",
        response: res,
      })
    } catch (err: any) {
      addResult({
        name: "❌ Chat Send",
        status: "error",
        error: err.message,
      })
    }
  }

  // Run all tests
  const runAllTests = async () => {
    clearResults()
    addResult({ name: "Starting comprehensive API tests...", status: "success" })
    
    // Auth flow
    await testRegister()
    await new Promise(r => setTimeout(r, 500))
    await testLogin()
    await new Promise(r => setTimeout(r, 500))
    await testAuthMe()
    
    // User
    await new Promise(r => setTimeout(r, 500))
    await testGetProfile()
    await new Promise(r => setTimeout(r, 500))
    await testUpdateProfile()
    
    // Farms
    await new Promise(r => setTimeout(r, 500))
    await testCreateFarm()
    await new Promise(r => setTimeout(r, 500))
    await testGetFarm()
    await new Promise(r => setTimeout(r, 500))
    await testAnalyzeSoil()
    
    // Harvests
    await new Promise(r => setTimeout(r, 500))
    await testCreateHarvest()
    await new Promise(r => setTimeout(r, 500))
    await testListHarvests()
    
    // Business Plans
    await new Promise(r => setTimeout(r, 500))
    await testCreateBusinessPlan()
    await new Promise(r => setTimeout(r, 500))
    await testListBusinessPlans()
    
    // Dashboard
    await new Promise(r => setTimeout(r, 500))
    await testDashboardStats()
    
    // Marketplace
    await new Promise(r => setTimeout(r, 500))
    await testListListings()
    
    // Chat
    await new Promise(r => setTimeout(r, 500))
    await testChatSend()
    
    addResult({ name: "All tests completed!", status: "success" })
  }

  const successCount = results.filter(r => r.status === "success").length
  const errorCount = results.filter(r => r.status === "error").length
  const passRate = results.length > 0 ? ((successCount / results.filter(r => r.status !== "loading").length) * 100).toFixed(0) : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary/10 to-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold">🧪 API Integration Tester</h1>
          <p className="text-muted-foreground text-lg">
            Test all 23 API endpoints to verify frontend integration
          </p>
        </div>

        {/* Test Controls */}
        <Card>
          <CardHeader>
            <CardTitle>Test Configuration</CardTitle>
            <CardDescription>Configure test parameters</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Test Email</Label>
                <Input
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  placeholder="test@example.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Test Password</Label>
                <Input
                  type="password"
                  value={testPassword}
                  onChange={(e) => setTestPassword(e.target.value)}
                />
              </div>
            </div>
            {token && (
              <div className="p-3 bg-green-50 border border-green-200 rounded text-sm">
                <strong>✅ Logged In:</strong> Token saved. Protected endpoints enabled.
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Buttons */}
        <Card>
          <CardHeader>
            <CardTitle>Test Individual Endpoints</CardTitle>
            <CardDescription>Click to test each API endpoint</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              <Button onClick={testBackendHealth} variant="default" size="sm" className="bg-green-600 hover:bg-green-700">
                🔥 Backend Health
              </Button>
              <Button onClick={testRegister} variant="outline" size="sm">
                Register
              </Button>
              <Button onClick={testLogin} variant="outline" size="sm">
                Login
              </Button>
              <Button onClick={testAuthMe} variant="outline" size="sm">
                Auth Me
              </Button>
              <Button onClick={testGetProfile} variant="outline" size="sm">
                Get Profile
              </Button>
              <Button onClick={testUpdateProfile} variant="outline" size="sm">
                Update Profile
              </Button>
              <Button onClick={testCreateFarm} variant="outline" size="sm">
                Create Farm
              </Button>
              <Button onClick={testGetFarm} variant="outline" size="sm">
                Get Farm
              </Button>
              <Button onClick={testAnalyzeSoil} variant="outline" size="sm">
                Analyze Soil
              </Button>
              <Button onClick={testCreateHarvest} variant="outline" size="sm">
                Create Harvest
              </Button>
              <Button onClick={testListHarvests} variant="outline" size="sm">
                List Harvests
              </Button>
              <Button onClick={testCreateBusinessPlan} variant="outline" size="sm">
                Create Plan
              </Button>
              <Button onClick={testListBusinessPlans} variant="outline" size="sm">
                List Plans
              </Button>
              <Button onClick={testDashboardStats} variant="outline" size="sm">
                Dashboard
              </Button>
              <Button onClick={testListListings} variant="outline" size="sm">
                Listings
              </Button>
              <Button onClick={testChatSend} variant="outline" size="sm">
                Chat
              </Button>
            </div>
            <Button onClick={runAllTests} className="w-full mt-4 bg-primary" size="lg">
              ▶️ Run All Tests
            </Button>
          </CardContent>
        </Card>

        {/* Results Summary */}
        {results.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Test Summary</CardTitle>
              <div className="flex gap-4 mt-4 text-sm">
                <div className="p-3 bg-green-50 border border-green-200 rounded">
                  ✅ Passed: <strong>{successCount}</strong>
                </div>
                <div className="p-3 bg-red-50 border border-red-200 rounded">
                  ❌ Failed: <strong>{errorCount}</strong>
                </div>
                <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                  📊 Pass Rate: <strong>{passRate}%</strong>
                </div>
              </div>
            </CardHeader>
          </Card>
        )}

        {/* Results */}
        <div className="space-y-3">
          {results.map((result, idx) => (
            <Card key={idx} className={
              result.status === "success" ? "border-green-200 bg-green-50" :
              result.status === "error" ? "border-red-200 bg-red-50" :
              result.status === "loading" ? "border-yellow-200 bg-yellow-50" :
              ""
            }>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-semibold">{result.name}</h4>
                    {result.timestamp && (
                      <span className="text-xs text-muted-foreground">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    )}
                  </div>
                  {result.error && (
                    <div className="text-sm text-red-600 font-mono bg-white p-2 rounded border border-red-200">
                      {result.error}
                    </div>
                  )}
                  {result.response && (
                    <details>
                      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                        View Response
                      </summary>
                      <pre className="text-xs bg-white p-3 rounded border mt-2 overflow-auto max-h-48">
                        {JSON.stringify(result.response, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {results.length > 0 && (
          <Button onClick={clearResults} variant="outline" className="w-full">
            Clear Results
          </Button>
        )}
      </div>
    </div>
  )
}
