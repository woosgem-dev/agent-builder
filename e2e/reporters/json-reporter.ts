import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';
import * as fs from 'fs';
import * as path from 'path';

interface TestResultData {
  name: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped' | 'timedOut' | 'interrupted';
  duration: number;
  error?: string;
  retry: number;
}

interface SuiteResultData {
  name: string;
  tests: TestResultData[];
  passed: number;
  failed: number;
  skipped: number;
}

interface DashboardData {
  timestamp: string;
  duration: number;
  summary: {
    total: number;
    passed: number;
    failed: number;
    skipped: number;
    passRate: number;
  };
  suites: SuiteResultData[];
  environment: {
    browser: string;
    baseURL: string;
    node: string;
  };
}

class JsonDashboardReporter implements Reporter {
  private results: Map<string, SuiteResultData> = new Map();
  private startTime: number = 0;
  private config!: FullConfig;

  onBegin(config: FullConfig, suite: Suite) {
    this.config = config;
    this.startTime = Date.now();
    console.log(`\n🧪 E2E 테스트 시작: ${suite.allTests().length}개 테스트\n`);
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const suiteName = test.parent.title || 'Default Suite';
    
    if (!this.results.has(suiteName)) {
      this.results.set(suiteName, {
        name: suiteName,
        tests: [],
        passed: 0,
        failed: 0,
        skipped: 0,
      });
    }

    const suite = this.results.get(suiteName)!;
    const testData: TestResultData = {
      name: test.title,
      file: test.location.file,
      status: result.status,
      duration: result.duration,
      retry: result.retry,
    };

    if (result.status === 'failed' && result.error) {
      testData.error = result.error.message;
    }

    suite.tests.push(testData);

    switch (result.status) {
      case 'passed':
        suite.passed++;
        console.log(`  ✅ ${test.title} (${result.duration}ms)`);
        break;
      case 'failed':
        suite.failed++;
        console.log(`  ❌ ${test.title} (${result.duration}ms)`);
        break;
      case 'skipped':
        suite.skipped++;
        console.log(`  ⏭️ ${test.title} (skipped)`);
        break;
      case 'timedOut':
        suite.failed++;
        console.log(`  ⏰ ${test.title} (timeout)`);
        break;
    }
  }

  onEnd(result: FullResult) {
    const duration = Date.now() - this.startTime;
    const suites = Array.from(this.results.values());

    const summary = suites.reduce(
      (acc, suite) => ({
        total: acc.total + suite.tests.length,
        passed: acc.passed + suite.passed,
        failed: acc.failed + suite.failed,
        skipped: acc.skipped + suite.skipped,
      }),
      { total: 0, passed: 0, failed: 0, skipped: 0 }
    );

    const dashboardData: DashboardData = {
      timestamp: new Date().toISOString(),
      duration,
      summary: {
        ...summary,
        passRate: summary.total > 0 
          ? Math.round((summary.passed / summary.total) * 100) 
          : 0,
      },
      suites,
      environment: {
        browser: this.config.projects[0]?.name || 'unknown',
        baseURL: this.config.projects[0]?.use?.baseURL || 'http://localhost:3000',
        node: process.version,
      },
    };

    // Save to JSON file
    const outputDir = path.join(process.cwd(), 'e2e-dashboard');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const outputPath = path.join(outputDir, 'results.json');
    fs.writeFileSync(outputPath, JSON.stringify(dashboardData, null, 2));

    // Also save history
    const historyPath = path.join(outputDir, 'history.json');
    let history: DashboardData[] = [];
    if (fs.existsSync(historyPath)) {
      try {
        history = JSON.parse(fs.readFileSync(historyPath, 'utf-8'));
      } catch {
        history = [];
      }
    }
    history.push(dashboardData);
    // Keep last 50 runs
    if (history.length > 50) {
      history = history.slice(-50);
    }
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));

    console.log(`\n${'─'.repeat(50)}`);
    console.log(`📊 테스트 결과 요약`);
    console.log(`${'─'.repeat(50)}`);
    console.log(`   총 테스트: ${summary.total}개`);
    console.log(`   ✅ 성공: ${summary.passed}개`);
    console.log(`   ❌ 실패: ${summary.failed}개`);
    console.log(`   ⏭️ 스킵: ${summary.skipped}개`);
    console.log(`   📈 성공률: ${dashboardData.summary.passRate}%`);
    console.log(`   ⏱️ 소요시간: ${(duration / 1000).toFixed(2)}s`);
    console.log(`${'─'.repeat(50)}`);
    console.log(`📁 결과 저장: ${outputPath}\n`);
  }
}

export default JsonDashboardReporter;
