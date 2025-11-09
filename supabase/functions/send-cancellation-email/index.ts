// supabase/functions/send-cancellation-email/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { Resend } from 'npm:resend@3.2.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS', 
}

// --- Helper Functions ---
function formatCurrency(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};
function formatDate(dateString: string): string {
  try {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  } catch (e) {
    return dateString;
  }
}
// --- End Helper Functions ---

Deno.serve(async (req) => {
  // Handle preflight (OPTIONS) request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // 1. Get secrets
  const supabaseUrl = Deno.env.get('PUBLIC_SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
  const resend = new Resend(resendApiKey);

  // 2. Create a Supabase client
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // 3. Get the booking_id
  const { booking_id } = await req.json();
  if (!booking_id) {
    return new Response(JSON.stringify({ error: 'booking_id is required' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
    });
  }

  try {
    // 4. Fetch the booking data
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        users (full_name), 
        hotels (name, address, thumbnail)
      `)
      .eq('id', booking_id)
      .single();

    if (error) throw new Error(error.message);
    if (!booking) throw new Error('Booking not found');

    // 5. Extract data for the email
    const userProfile = booking.users as { full_name: string };
    const hotel = booking.hotels as { name: string; address: { street: string; city: string }; thumbnail: string };
    
    // 5b. Get the user's email from the auth system
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin
      .getUserById(booking.user_id);

    if (authError) throw authError;
    if (!authUser || !authUser.user.email) throw new Error('Could not find user email in auth system.');
    
    // 6. Combine user data
    const user = {
      email: authUser.user.email,
      full_name: userProfile.full_name
    }
    
    if (!user || !user.email) throw new Error('User or email not found for this booking');
    if (!hotel) throw new Error('Hotel not found for this booking');

    const checkIn = formatDate(booking.check_in);
    const total = formatCurrency(booking.price_breakdown.total, booking.currency);
    const hotelAddress = `${hotel.address.street}, ${hotel.address.city}`;

    // 7. (NEW) Cancellation & Refund Logic
    const checkInDate = new Date(booking.check_in);
    const now = new Date();
    // Calculate hours difference
    const hoursDiff = (checkInDate.getTime() - now.getTime()) / (1000 * 60 * 60);
    const isRefundable = hoursDiff > 48;

    const subject = isRefundable
      ? `Booking Cancelled - Refund Processed (Ref: ${booking.booking_reference})`
      : `Booking Cancelled (Ref: ${booking.booking_reference})`;

    const refundMessage = isRefundable
      ? `As you cancelled more than 48 hours before check-in, a full refund of <strong>${total}</strong> is being processed. It should appear on your original payment method within 5-10 business days.`
      : `As this cancellation is within 48 hours of check-in, it is not eligible for a refund per our cancellation policy.`;

    const refundStatus = isRefundable ? 'Refund Eligible' : 'Non-Refundable';
    const refundColor = isRefundable ? '#007bff' : '#dc3545'; // Blue vs Red

    // 8. Send the email using Resend
    await resend.emails.send({
      from: 'ProBooker@houseofstk.com', // Use the same 'from' address
      to: [user.email],
      subject: subject,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Cancelled</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
          .header { background-color: #0d6efd; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; color: #ffffff; }
          .content { padding: 32px; }
          .content p { margin-bottom: 24px; line-height: 1.6; color: #333; }
          .details-card { background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-top: 24px; }
          .details-card h3 { margin-top: 0; color: #333; }
          .details-item { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #e0e0e0; }
          .details-item:last-child { border-bottom: none; }
          .details-item strong { color: #555; }
          .refund-box { padding: 20px; border-radius: 8px; margin-top: 24px; background-color: ${isRefundable ? '#e6f7ff' : '#ffebee'}; border: 1px solid ${isRefundable ? '#b3e0ff' : '#ffcdd2'}; }
          .refund-box h3 { margin-top: 0; color: ${refundColor}; }
          .refund-box p { color: #333; }
          .footer { text-align: center; padding: 24px; font-size: 12px; color: #888; background-color: #f8f9fa; }
        </style>
      </head>
      <body style="background-color: #f4f4f4; padding: 20px;">
        <span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
          Your booking (Ref: ${booking.booking_reference}) has been cancelled. ${refundStatus}.
        </span>
      
        <table class="container" role="presentation" border="0" cellpadding="0" cellspacing="0">
          <tr>
            <td>
              <div class="header">
                <h1 style="color: #ffffff;">ProBooker</h1>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div class="content">
                <h2 style="font-size: 24px; color: #dc3545; margin-top: 0;">Booking Cancelled</h2>
                <p>Hello ${user.full_name || 'Guest'},</p>
                <p>This email is to confirm that your booking at <strong>${hotel.name}</strong> has been successfully cancelled.</p>
      
                <div class="details-card">
                  <h3>Cancellation Details</h3>
                  <div class="details-item">
                    <span>Reference:</span>
                    <strong>${booking.booking_reference}</strong>
                  </div>
                  <div class="details-item">
                    <span>Hotel:</span>
                    <strong>${hotel.name}</strong>
                  </div>
                  <div class="details-item">
                    <span>Address:</span>
                    <strong>${hotelAddress}</strong>
                  </div>
                  <div class="details-item">
                    <span>Original Check-in:</span>
                    <strong>${checkIn}</strong>
                  </div>
                </div>
      
                <div class="refund-box" style="background-color: ${isRefundable ? '#e6f7ff' : '#ffebee'}; border: 1px solid ${isRefundable ? '#b3e0ff' : '#ffcdd2'};">
                  <h3 style="color: ${refundColor};">${refundStatus}</h3>
                  <p style="margin-bottom: 0;">${refundMessage}</p>
                </div>
      
                <p style="margin-top: 24px;">We're sorry to see you go. We hope you'll book with ProBooker again in the future.</p>
              </div>
            </td>
          </tr>
          <tr>
            <td>
              <div class="footer">
                &copy; ${new Date().getFullYear()} ProBooker. All rights reserved.
              </div>
            </td>
          </tr>
        </table>
      </body>
      </html>
      `,
    });

    // 9. Return a success response
    return new Response(JSON.stringify({ success: true, ref: booking.booking_reference }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
    });

  } catch (error) {
    // 10. Return an error response
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
    });
  }
})