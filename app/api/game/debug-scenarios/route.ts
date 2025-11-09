import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

    // Get user from session
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { action, cheat_code_id } = await request.json();

    if (!action || !cheat_code_id) {
      return NextResponse.json(
        { success: false, error: 'Missing action or cheat_code_id' },
        { status: 400 }
      );
    }

    if (action === 'delete_scenarios') {
      // Delete all scenarios for this cheat code
      const { error: deleteError } = await supabase
        .from('game_scenarios')
        .delete()
        .eq('cheat_code_id', cheat_code_id)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting scenarios:', deleteError);
        return NextResponse.json(
          { success: false, error: deleteError.message },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: 'All scenarios deleted. You can now regenerate them.',
      });
    }

    if (action === 'get_cheat_code_content') {
      // Fetch and return the cheat code content for inspection
      const { data: cheatCode, error: fetchError } = await supabase
        .from('cheat_codes')
        .select('content, title')
        .eq('id', cheat_code_id)
        .eq('user_id', user.id)
        .maybeSingle();

      if (fetchError) {
        return NextResponse.json(
          { success: false, error: fetchError.message },
          { status: 500 }
        );
      }

      if (!cheatCode) {
        return NextResponse.json(
          { success: false, error: 'Cheat code not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        title: cheatCode.title,
        content: cheatCode.content,
      });
    }

    return NextResponse.json(
      { success: false, error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error in debug endpoint:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
