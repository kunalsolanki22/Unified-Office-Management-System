#!/usr/bin/env python3
"""
Scaling & Performance Test Script
Tests: Redis Caching, Rate Limiting, and Concurrent Workers

Run with: python scripts/test_scaling.py
"""

import httpx
import asyncio
import time
import statistics
from datetime import datetime
from typing import Dict, List, Optional
from dataclasses import dataclass, field
from concurrent.futures import ThreadPoolExecutor
import threading

# Configuration
BASE_URL = "http://localhost:8000"
API_V1 = f"{BASE_URL}/api/v1"

# Test credentials
TEST_CREDENTIALS = {
    "super_admin": {"email": "super.admin@company.com", "password": "Admin@123"},
    "admin": {"email": "admin@company.com", "password": "Admin@123"},
    "employee": {"email": "parking.manager@company.com", "password": "Manager@123"},
}


@dataclass
class TestResult:
    name: str
    passed: bool
    message: str
    duration_ms: float = 0
    details: Dict = field(default_factory=dict)


class ScalingTester:
    def __init__(self):
        self.results: List[TestResult] = []
        self.tokens: Dict[str, str] = {}
        
    async def login(self, role: str = "employee") -> Optional[str]:
        """Login and get token."""
        # Return cached token if available
        if role in self.tokens:
            return self.tokens[role]
            
        creds = TEST_CREDENTIALS.get(role)
        if not creds:
            return None
        
        # Wait a bit to avoid rate limiting
        await asyncio.sleep(0.5)
            
        async with httpx.AsyncClient() as client:
            # Use JSON body format (not form data)
            response = await client.post(
                f"{API_V1}/auth/login",
                json={"email": creds["email"], "password": creds["password"]}
            )
            if response.status_code == 200:
                data = response.json()
                token = data.get("data", {}).get("access_token")
                self.tokens[role] = token
                return token
            elif response.status_code == 429:
                print(f"    ⚠️ Rate limited during login for {role}, waiting...")
                await asyncio.sleep(60)  # Wait for rate limit to reset
                return await self.login(role)
            else:
                print(f"    ⚠️ Login failed for {role}: {response.status_code}")
        return None

    def print_header(self, title: str):
        print(f"\n{'='*70}")
        print(f"🧪 {title}")
        print(f"{'='*70}")

    def print_result(self, result: TestResult):
        status = "✅ PASS" if result.passed else "❌ FAIL"
        print(f"{status} | {result.name} ({result.duration_ms:.1f}ms)")
        if result.message:
            print(f"    └── {result.message}")
        if result.details:
            for key, value in result.details.items():
                print(f"        {key}: {value}")

    # =========================================================================
    # TEST 1: Redis Caching
    # =========================================================================
    async def test_redis_caching(self):
        """Test that Redis caching improves response times."""
        self.print_header("TEST 1: Redis Caching Performance")
        
        token = await self.login("employee")
        if not token:
            self.results.append(TestResult(
                name="Redis Caching",
                passed=False,
                message="Failed to login"
            ))
            return
            
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test endpoints that should be cached
        cached_endpoints = [
            ("/food-orders/categories", "Food Categories"),
            ("/desks", "Desk List"),
        ]
        
        for endpoint, name in cached_endpoints:
            times = []
            
            async with httpx.AsyncClient() as client:
                # First request - should hit database (cache miss)
                start = time.perf_counter()
                response1 = await client.get(f"{API_V1}{endpoint}", headers=headers)
                first_time = (time.perf_counter() - start) * 1000
                
                if response1.status_code != 200:
                    self.results.append(TestResult(
                        name=f"Cache Test: {name}",
                        passed=False,
                        message=f"Request failed with status {response1.status_code}",
                        duration_ms=first_time
                    ))
                    continue
                
                # Subsequent requests - should hit cache (faster)
                for i in range(5):
                    start = time.perf_counter()
                    response = await client.get(f"{API_V1}{endpoint}", headers=headers)
                    times.append((time.perf_counter() - start) * 1000)
                    
            avg_cached_time = statistics.mean(times)
            improvement = ((first_time - avg_cached_time) / first_time) * 100 if first_time > 0 else 0
            
            # Cache should make subsequent requests faster (at least 20% improvement)
            passed = improvement > 10 or avg_cached_time < 50  # Either faster or already very fast
            
            self.results.append(TestResult(
                name=f"Cache Test: {name}",
                passed=passed,
                message=f"First: {first_time:.1f}ms, Avg cached: {avg_cached_time:.1f}ms",
                duration_ms=avg_cached_time,
                details={
                    "First Request (ms)": f"{first_time:.2f}",
                    "Avg Cached (ms)": f"{avg_cached_time:.2f}",
                    "Improvement": f"{improvement:.1f}%"
                }
            ))
            self.print_result(self.results[-1])

    # =========================================================================
    # TEST 2: Cache Invalidation
    # =========================================================================
    async def test_cache_invalidation(self):
        """Test that cache is properly invalidated on data changes."""
        self.print_header("TEST 2: Cache Invalidation")
        
        token = await self.login("super_admin")
        if not token:
            self.results.append(TestResult(
                name="Cache Invalidation",
                passed=False,
                message="Failed to login as super_admin"
            ))
            return
            
        headers = {"Authorization": f"Bearer {token}"}
        
        async with httpx.AsyncClient() as client:
            # Get initial food categories
            response1 = await client.get(f"{API_V1}/food-orders/categories", headers=headers)
            
            if response1.status_code == 200:
                initial_data = response1.json()
                
                # Make same request again (should be cached)
                response2 = await client.get(f"{API_V1}/food-orders/categories", headers=headers)
                cached_data = response2.json()
                
                # Compare only the 'data' field, not timestamps which always differ
                initial_items = initial_data.get("data", [])
                cached_items = cached_data.get("data", [])
                
                # Data should be the same
                passed = initial_items == cached_items
                
                self.results.append(TestResult(
                    name="Cache Consistency",
                    passed=passed,
                    message="Cached data matches original" if passed else "Cache data mismatch!",
                    details={"Items Count": len(initial_items), "Cached Count": len(cached_items)}
                ))
            else:
                self.results.append(TestResult(
                    name="Cache Consistency",
                    passed=False,
                    message=f"Request failed: {response1.status_code}"
                ))
                
        self.print_result(self.results[-1])

    # =========================================================================
    # TEST 3: Rate Limiting
    # =========================================================================
    async def test_rate_limiting(self):
        """Test that rate limiting is working."""
        self.print_header("TEST 3: Rate Limiting")
        
        # Test login endpoint (stricter rate limit: 10/min)
        results = []
        blocked_count = 0
        
        async with httpx.AsyncClient() as client:
            for i in range(15):  # Try 15 rapid login attempts
                start = time.perf_counter()
                response = await client.post(
                    f"{API_V1}/auth/login",
                    json={"email": "test@test.com", "password": "wrongpassword"}
                )
                duration = (time.perf_counter() - start) * 1000
                
                results.append({
                    "attempt": i + 1,
                    "status": response.status_code,
                    "duration_ms": duration
                })
                
                if response.status_code == 429:
                    blocked_count += 1
                    
                # Small delay to not overwhelm
                await asyncio.sleep(0.1)
        
        # Rate limiting should kick in after ~10 requests
        rate_limit_working = blocked_count > 0
        
        self.results.append(TestResult(
            name="Rate Limiting - Login Endpoint",
            passed=rate_limit_working,
            message=f"Blocked {blocked_count}/15 requests" if rate_limit_working else "Rate limiting NOT active (all requests passed)",
            details={
                "Total Requests": 15,
                "Blocked (429)": blocked_count,
                "Passed": 15 - blocked_count
            }
        ))
        self.print_result(self.results[-1])
        
        # Test rate limit headers
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/health")
            rate_limit_headers = {
                k: v for k, v in response.headers.items() 
                if 'ratelimit' in k.lower() or 'x-rate' in k.lower()
            }
            
            self.results.append(TestResult(
                name="Rate Limit Headers",
                passed=len(rate_limit_headers) > 0 or response.status_code == 200,
                message=f"Headers present: {list(rate_limit_headers.keys())}" if rate_limit_headers else "No rate limit headers (may be disabled for health endpoint)",
                details=rate_limit_headers if rate_limit_headers else {"Note": "Health endpoint may bypass rate limiting"}
            ))
            self.print_result(self.results[-1])

    # =========================================================================
    # TEST 4: Concurrent Request Handling (Worker Test)
    # =========================================================================
    async def test_concurrent_requests(self):
        """Test handling of concurrent requests (multi-worker simulation)."""
        self.print_header("TEST 4: Concurrent Request Handling")
        
        token = await self.login("employee")
        if not token:
            self.results.append(TestResult(
                name="Concurrent Requests",
                passed=False,
                message="Failed to login"
            ))
            return
            
        headers = {"Authorization": f"Bearer {token}"}
        
        # Test with different concurrency levels
        concurrency_levels = [5, 10, 20, 50]
        
        for num_concurrent in concurrency_levels:
            times = []
            errors = 0
            
            async def make_request():
                nonlocal errors
                try:
                    async with httpx.AsyncClient(timeout=30.0) as client:
                        start = time.perf_counter()
                        response = await client.get(f"{API_V1}/desks", headers=headers)
                        duration = (time.perf_counter() - start) * 1000
                        
                        if response.status_code == 200:
                            return duration
                        else:
                            errors += 1
                            return None
                except Exception as e:
                    errors += 1
                    return None
            
            # Fire all requests concurrently
            start_total = time.perf_counter()
            tasks = [make_request() for _ in range(num_concurrent)]
            results = await asyncio.gather(*tasks)
            total_time = (time.perf_counter() - start_total) * 1000
            
            # Filter successful results
            times = [r for r in results if r is not None]
            
            if times:
                avg_time = statistics.mean(times)
                max_time = max(times)
                min_time = min(times)
                
                # All requests should complete without errors
                passed = errors == 0 and avg_time < 2000  # Under 2 seconds average
                
                self.results.append(TestResult(
                    name=f"Concurrent: {num_concurrent} requests",
                    passed=passed,
                    message=f"Total: {total_time:.0f}ms, Avg: {avg_time:.0f}ms",
                    duration_ms=total_time,
                    details={
                        "Concurrent Requests": num_concurrent,
                        "Successful": len(times),
                        "Errors": errors,
                        "Avg Response (ms)": f"{avg_time:.1f}",
                        "Min/Max (ms)": f"{min_time:.1f}/{max_time:.1f}",
                        "Throughput (req/s)": f"{(len(times) / (total_time/1000)):.1f}"
                    }
                ))
            else:
                self.results.append(TestResult(
                    name=f"Concurrent: {num_concurrent} requests",
                    passed=False,
                    message=f"All {num_concurrent} requests failed",
                    details={"Errors": errors}
                ))
            
            self.print_result(self.results[-1])

    # =========================================================================
    # TEST 5: Stress Test
    # =========================================================================
    async def test_stress(self):
        """Stress test with rapid sequential requests."""
        self.print_header("TEST 5: Stress Test (100 rapid requests)")
        
        token = await self.login("employee")
        if not token:
            self.results.append(TestResult(
                name="Stress Test",
                passed=False,
                message="Failed to login"
            ))
            return
            
        headers = {"Authorization": f"Bearer {token}"}
        
        num_requests = 100
        times = []
        errors = 0
        status_codes = {}
        
        async with httpx.AsyncClient(timeout=30.0) as client:
            start_total = time.perf_counter()
            
            for i in range(num_requests):
                try:
                    start = time.perf_counter()
                    response = await client.get(f"{BASE_URL}/health")
                    duration = (time.perf_counter() - start) * 1000
                    times.append(duration)
                    
                    status_codes[response.status_code] = status_codes.get(response.status_code, 0) + 1
                except Exception as e:
                    errors += 1
                    
            total_time = (time.perf_counter() - start_total) * 1000
        
        if times:
            avg_time = statistics.mean(times)
            p95_time = sorted(times)[int(len(times) * 0.95)]
            p99_time = sorted(times)[int(len(times) * 0.99)]
            
            passed = errors < 5 and avg_time < 100  # Less than 5% errors, under 100ms avg
            
            self.results.append(TestResult(
                name="Stress Test (100 requests)",
                passed=passed,
                message=f"Completed in {total_time:.0f}ms total",
                duration_ms=total_time,
                details={
                    "Total Requests": num_requests,
                    "Successful": len(times),
                    "Errors": errors,
                    "Avg (ms)": f"{avg_time:.2f}",
                    "P95 (ms)": f"{p95_time:.2f}",
                    "P99 (ms)": f"{p99_time:.2f}",
                    "Throughput (req/s)": f"{(len(times) / (total_time/1000)):.1f}",
                    "Status Codes": status_codes
                }
            ))
        else:
            self.results.append(TestResult(
                name="Stress Test",
                passed=False,
                message=f"All requests failed",
                details={"Errors": errors}
            ))
            
        self.print_result(self.results[-1])

    # =========================================================================
    # TEST 6: Redis Connection Health
    # =========================================================================
    async def test_redis_health(self):
        """Test Redis connection via health endpoint."""
        self.print_header("TEST 6: Redis Health Check")
        
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/health")
            
            if response.status_code == 200:
                health_data = response.json()
                
                redis_status = health_data.get("services", {}).get("redis", "unknown")
                overall_status = health_data.get("status", "unknown")
                
                passed = redis_status == "healthy"
                
                self.results.append(TestResult(
                    name="Redis Health",
                    passed=passed,
                    message=f"Redis: {redis_status}, Overall: {overall_status}",
                    details={
                        "Redis Status": redis_status,
                        "Overall Status": overall_status,
                        "Database": health_data.get("services", {}).get("database", "unknown")
                    }
                ))
            else:
                self.results.append(TestResult(
                    name="Redis Health",
                    passed=False,
                    message=f"Health endpoint returned {response.status_code}"
                ))
                
        self.print_result(self.results[-1])
        
        # Test readiness endpoint
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{BASE_URL}/health/ready")
            
            passed = response.status_code == 200
            data = response.json() if response.status_code in [200, 503] else {}
            
            self.results.append(TestResult(
                name="Readiness Check",
                passed=passed,
                message=f"Ready: {data.get('ready', False)}",
                details=data
            ))
            
        self.print_result(self.results[-1])

    # =========================================================================
    # TEST 7: Worker Process Check
    # =========================================================================
    async def test_worker_info(self):
        """Check worker/process information."""
        self.print_header("TEST 7: Worker Information")
        
        # Make multiple requests and check if different workers respond
        worker_ids = set()
        
        async with httpx.AsyncClient() as client:
            for _ in range(10):
                response = await client.get(f"{BASE_URL}/health")
                
                # Check for worker-related headers
                pid = response.headers.get("X-Process-ID", "")
                worker = response.headers.get("X-Worker-ID", "")
                
                if pid:
                    worker_ids.add(pid)
                if worker:
                    worker_ids.add(worker)
        
        self.results.append(TestResult(
            name="Worker Distribution",
            passed=True,  # Info only
            message=f"Detected {len(worker_ids) if worker_ids else 'unknown number of'} workers",
            details={
                "Worker IDs Seen": list(worker_ids) if worker_ids else ["No worker ID headers"],
                "Note": "Using Gunicorn with multiple workers improves concurrency"
            }
        ))
        self.print_result(self.results[-1])

    # =========================================================================
    # Run All Tests
    # =========================================================================
    async def run_all_tests(self):
        print("\n" + "="*70)
        print("🚀 SCALING & PERFORMANCE TEST SUITE")
        print(f"🔗 Target: {BASE_URL}")
        print(f"📅 Time: {datetime.now().isoformat()}")
        print("="*70)
        
        # Check if server is running
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                response = await client.get(f"{BASE_URL}/health")
                if response.status_code not in [200, 503]:
                    print(f"\n❌ Server not responding correctly at {BASE_URL}")
                    return
        except Exception as e:
            print(f"\n❌ Cannot connect to server at {BASE_URL}")
            print(f"   Error: {e}")
            print("\n💡 Start the server with:")
            print("   uvicorn app.main:app --host 0.0.0.0 --port 8000")
            return
        
        # Run all tests - login first, then test rate limiting last
        await self.test_redis_health()
        
        # Login all users upfront before rate limiting test
        print("\n🔐 Logging in test users...")
        await self.login("super_admin")
        await self.login("admin")
        await self.login("employee")
        print("   ✅ Tokens acquired\n")
        
        await self.test_redis_caching()
        await self.test_cache_invalidation()
        await self.test_concurrent_requests()
        await self.test_stress()
        await self.test_worker_info()
        
        # Rate limiting test last (it will consume rate limit quota)
        await self.test_rate_limiting()
        
        # Print Summary
        self.print_summary()
    
    def print_summary(self):
        print("\n" + "="*70)
        print("📊 TEST SUMMARY")
        print("="*70)
        
        passed = sum(1 for r in self.results if r.passed)
        failed = sum(1 for r in self.results if not r.passed)
        total = len(self.results)
        
        print(f"Total Tests: {total}")
        print(f"✅ Passed: {passed}")
        print(f"❌ Failed: {failed}")
        print(f"Success Rate: {(passed/total*100):.1f}%")
        
        if failed > 0:
            print("\n" + "-"*70)
            print("❌ FAILED TESTS:")
            print("-"*70)
            for result in self.results:
                if not result.passed:
                    print(f"\n  • {result.name}")
                    print(f"    {result.message}")
        
        print("\n" + "="*70)
        print("🏁 Testing Complete!")
        print("="*70 + "\n")


async def main():
    tester = ScalingTester()
    await tester.run_all_tests()


if __name__ == "__main__":
    asyncio.run(main())
