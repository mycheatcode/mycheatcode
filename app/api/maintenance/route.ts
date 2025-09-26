import { NextRequest, NextResponse } from 'next/server';
import { runAllMaintenanceJobs, runDecayJob, runGreenHoldMaintenanceJob } from '../../../lib/maintenance-jobs';

// API endpoint for running maintenance jobs
// This can be called by external cron services or internal schedulers
export async function POST(request: NextRequest) {
  try {
    // Verify authorization (you may want to add API key validation here)
    const authHeader = request.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get job type from query params or body
    const url = new URL(request.url);
    const jobType = url.searchParams.get('job') || 'all';

    let results;

    switch (jobType) {
      case 'decay':
        results = { decay_results: await runDecayJob() };
        break;

      case 'green-hold':
        results = { green_hold_results: await runGreenHoldMaintenanceJob() };
        break;

      case 'all':
      default:
        results = await runAllMaintenanceJobs();
        break;
    }

    return NextResponse.json({
      success: true,
      job_type: jobType,
      timestamp: new Date().toISOString(),
      results
    });

  } catch (error) {
    console.error('Maintenance job error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

// GET endpoint for health check
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    service: 'maintenance-jobs',
    timestamp: new Date().toISOString()
  });
}