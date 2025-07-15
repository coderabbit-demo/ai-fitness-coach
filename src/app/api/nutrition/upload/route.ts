import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';
import { inngest } from '@/lib/inngest/client';
import logger from '@/lib/logger';

/**
 * Handles image upload and nutrition log creation for authenticated users.
 *
 * Accepts a multipart form request containing an image and optional notes. Validates the image type and size, uploads it to Supabase Storage, generates a signed URL, and creates a nutrition log entry in the database. Triggers an AI analysis event for the uploaded image and returns a JSON response with the log ID and image URL. Returns appropriate error responses for authentication, validation, or upload failures.
 *
 * @returns A JSON response indicating success with the log ID and image URL, or an error message with the appropriate HTTP status code.
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const image = formData.get('image') as File;
    const notes = formData.get('notes') as string;

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 });
    }

    // Validate image type and size
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(image.type)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 });
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (image.size > maxSize) {
      return NextResponse.json({ error: 'Image too large' }, { status: 400 });
    }

    // Upload image to Supabase Storage
    const fileName = `${user.id}/${Date.now()}-${image.name}`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('meal-images')
      .upload(fileName, image, {
        cacheControl: '3600',
        upsert: false,
      });

    if (uploadError) {
      logger.error('Image upload failed', { error: uploadError, userId: user.id });
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }

    // Get signed URL for secure access
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('meal-images')
      .createSignedUrl(fileName, 86400); // 24 hours expiry

    if (signedUrlError) {
      logger.error('Failed to create signed URL', { error: signedUrlError, userId: user.id });
      return NextResponse.json({ error: 'Failed to create signed URL' }, { status: 500 });
    }

    // Create nutrition log entry
    const { data: logData, error: logError } = await supabase
      .from('nutrition_logs')
      .insert({
        user_id: user.id,
        image_url: signedUrlData.signedUrl,
        notes: notes || null,
        processing_status: 'pending',
      })
      .select()
      .single();

    if (logError) {
      logger.error('Failed to create nutrition log', { error: logError, userId: user.id });
      return NextResponse.json({ error: 'Failed to create log' }, { status: 500 });
    }

    // Update processing status to 'processing'
    await supabase
      .from('nutrition_logs')
      .update({ processing_status: 'processing' })
      .eq('id', logData.id);

    // Trigger AI analysis
    if (inngest) {
      await inngest.send({
        name: 'food/image.uploaded',
        data: {
          imageUrl: signedUrlData.signedUrl,
          userId: user.id,
          logId: logData.id,
        },
      });
      logger.info('AI analysis triggered for nutrition log', { logId: logData.id });
    } else {
      logger.error('Cannot trigger AI analysis - Inngest client not available (missing INNGEST_EVENT_KEY)', { logId: logData.id });
    }

    logger.info('Image uploaded and processing started', {
      userId: user.id,
      logId: logData.id,
      imageUrl: signedUrlData.signedUrl
    });

    return NextResponse.json({
      success: true,
      logId: logData.id,
      imageUrl: signedUrlData.signedUrl,
    });

  } catch (error) {
    logger.error('Upload API error', { error });
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 