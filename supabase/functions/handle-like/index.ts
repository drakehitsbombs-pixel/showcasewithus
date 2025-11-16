import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get user from auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { target_user_id } = body;

    // Input validation
    if (!target_user_id || typeof target_user_id !== 'string') {
      return new Response(JSON.stringify({ error: 'target_user_id required and must be a string' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(target_user_id)) {
      return new Response(JSON.stringify({ error: 'target_user_id must be a valid UUID' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Determine roles
    const { data: userRole } = await supabase
      .from('users_extended')
      .select('role')
      .eq('id', user.id)
      .single();

    const { data: targetRole } = await supabase
      .from('users_extended')
      .select('role')
      .eq('id', target_user_id)
      .single();

    const isClientLikingCreator = userRole?.role === 'client' && targetRole?.role === 'creator';
    
    let creator_user_id = isClientLikingCreator ? target_user_id : user.id;
    let client_user_id = isClientLikingCreator ? user.id : target_user_id;

    // Check for reciprocal like - if target has already liked current user
    const { data: reciprocalMatch } = await supabase
      .from('matches')
      .select('*')
      .eq('creator_user_id', creator_user_id)
      .eq('client_user_id', client_user_id)
      .single();

    let matched = false;
    let thread_id = null;

    if (reciprocalMatch) {
      // It's a match! Update status and create/find thread atomically
      
      // Update match status
      const updateData = isClientLikingCreator 
        ? { status: 'matched', client_liked: true }
        : { status: 'matched', creator_liked: true };

      await supabase
        .from('matches')
        .update(updateData)
        .eq('id', reciprocalMatch.id);

      // Find or create thread
      const { data: existingThread } = await supabase
        .from('threads')
        .select('id')
        .eq('creator_user_id', creator_user_id)
        .eq('client_user_id', client_user_id)
        .eq('status', 'open')
        .single();

      if (existingThread) {
        thread_id = existingThread.id;
      } else {
        const { data: newThread, error: threadError } = await supabase
          .from('threads')
          .insert({
            creator_user_id,
            client_user_id,
            status: 'open',
          })
          .select('id')
          .single();

        if (threadError) {
          console.error('Thread creation error:', threadError);
          throw threadError;
        }

        thread_id = newThread.id;
      }

      matched = true;
    } else {
      // Just create the match/like record
      const insertData = {
        creator_user_id,
        client_user_id,
        status: 'liked',
        ...(isClientLikingCreator ? { client_liked: true } : { creator_liked: true }),
      };

      await supabase
        .from('matches')
        .insert(insertData);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        matched, 
        thread_id 
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error in handle-like:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});