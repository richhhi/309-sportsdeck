import { NextRequest, NextResponse } from 'next/server';
import { runDailySyncsNow } from "../../../../app/jobs/scheduler";
import { getUserFromRequest } from "../../../../lib/auth";

export async function POST(request: NextRequest) {
    try {
        const user = getUserFromRequest(request);
        if (user == null || user.role !== "ADMIN") {
            return NextResponse.json({ error: "unauthorized" }, { status: 401 });
        }

        await runDailySyncsNow();
        return NextResponse.json({ success: true, message: 'Sync completed' });
    } catch (error) {
        console.error('Manual sync failed:', error);
        return NextResponse.json({ error: 'Sync failed' }, { status: 500 });
    }
}
