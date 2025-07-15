import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'
import { NutritionLogInput } from '@/lib/nutrition-types'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let body: NutritionLogInput
    try {
      body = await request.json()
    } catch (error) {
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    // Validate required fields
    if (!body.food_items || !Array.isArray(body.food_items) || body.food_items.length === 0) {
      return NextResponse.json({ error: 'food_items is required and must be a non-empty array' }, { status: 400 })
    }

    // Validate total_calories
    if (typeof body.total_calories !== 'number' || body.total_calories < 0) {
      return NextResponse.json({ error: 'total_calories must be a non-negative number' }, { status: 400 })
    }

    // Validate optional nutrition fields if provided
    if (body.total_protein_g !== undefined && (typeof body.total_protein_g !== 'number' || body.total_protein_g < 0)) {
      return NextResponse.json({ error: 'total_protein_g must be a non-negative number' }, { status: 400 })
    }

    if (body.total_carbs_g !== undefined && (typeof body.total_carbs_g !== 'number' || body.total_carbs_g < 0)) {
      return NextResponse.json({ error: 'total_carbs_g must be a non-negative number' }, { status: 400 })
    }

    if (body.total_fat_g !== undefined && (typeof body.total_fat_g !== 'number' || body.total_fat_g < 0)) {
      return NextResponse.json({ error: 'total_fat_g must be a non-negative number' }, { status: 400 })
    }

    // Insert nutrition log
    const { data, error } = await supabase
      .from('nutrition_logs')
      .insert({
        user_id: user.id,
        food_items: body.food_items,
        total_calories: body.total_calories,
        total_protein_g: body.total_protein_g,
        total_carbs_g: body.total_carbs_g,
        total_fat_g: body.total_fat_g,
        total_fiber_g: body.total_fiber_g,
        image_url: body.image_url,
        confidence_score: body.confidence_score || 0,
        notes: body.notes
      })
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to save nutrition log' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    
    // Validate pagination parameters
    const limitParam = searchParams.get('limit') || '10'
    const offsetParam = searchParams.get('offset') || '0'
    
    const limit = parseInt(limitParam)
    const offset = parseInt(offsetParam)
    
    // Validate limit: must be positive integer with maximum of 100
    if (isNaN(limit) || limit < 1 || limit > 100) {
      return NextResponse.json({ error: 'Invalid limit parameter. Must be between 1 and 100.' }, { status: 400 })
    }
    
    // Validate offset: must be non-negative integer
    if (isNaN(offset) || offset < 0) {
      return NextResponse.json({ error: 'Invalid offset parameter. Must be non-negative integer.' }, { status: 400 })
    }

    // Get nutrition logs
    const { data, error } = await supabase
      .from('nutrition_logs')
      .select('*')
      .order('logged_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to fetch nutrition logs' }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}