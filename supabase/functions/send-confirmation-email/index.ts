// supabase/functions/send-confirmation-email/index.ts
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
    
    // --- (NEW) 5b. Get the user's email from the auth system ---
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
    const checkOut = formatDate(booking.check_out);
    const total = formatCurrency(booking.price_breakdown.total, booking.currency);
    const hotelAddress = `${hotel.address.street}, ${hotel.address.city}`;

    // 7. Send the email using Resend
    await resend.emails.send({
      from: 'StayCasa@houseofstk.com', 
      to: [user.email],
      subject: `Your Booking is Confirmed! (Ref: ${booking.booking_reference})`,
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Booking Confirmed</title>
        <style>
          body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; }
          .container { width: 100%; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #e0e0e0; }
          .header { background-color: #0d6efd; color: #ffffff; padding: 24px; text-align: center; }
          .header h1 { margin: 0; font-size: 28px; color: #ffffff; }
          .content { padding: 32px; }
          .content p { margin-bottom: 24px; line-height: 1.6; color: #333; }
          .details-card { background-color: #f8f9fa; border-radius: 8px; padding: 24px; margin-top: 24px; }
          .details-card h3 { margin-top: 0; color: #333; }
          .details-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #e0e0e0; }
          .details-item:last-child { border-bottom: none; }
          .details-item strong { color: #555; }
          .hotel-image { width: 100%; max-height: 200px; object-fit: cover; border-radius: 8px; margin-bottom: 24px; }
          .total-box { display: flex; justify-content: space-between; align-items: center; padding: 20px; background-color: #f8f9fa; border-radius: 8px; margin-top: 24px; }
          .total-box span { font-size: 18px; color: #555; }
          .total-box strong { font-size: 22px; color: #0d6efd; }
          .footer { text-align: center; padding: 24px; font-size: 12px; color: #888; background-color: #f8f9fa; }
        </style>
      </head>
      <body style="background-color: #f4f4f4; padding: 20px;">
        <span style="display:none;font-size:1px;color:#ffffff;line-height:1px;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">
          Your booking at ${hotel.name} is confirmed! (Ref: ${booking.booking_reference})
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
                <h2 style="font-size: 24px; color: #28a745; margin-top: 0;">Booking Confirmed!</h2>
                <p>Hello ${user.full_name || 'Guest'},</p>
                <p>Your booking at <strong>${hotel.name}</strong> is confirmed. We can't wait to host you!</p>
                
                <img src="${hotel.thumbnail || 'https://placehold.co/600x200'}" alt="${hotel.name} Image" class="hotel-image">

                <div class="details-card">
                  <h3>Your Booking Details</h3>
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
                    <span>Check-in:</span>
                    <strong>${checkIn}</strong>
                  </div>
                  <div class="details-item">
                    <span>Check-out:</span>
                    <strong>${checkOut}</strong>
                  </div>
                </div>
      
                <div class="total-box">
                  <span>Total Paid:</span>
                  <strong>${total}</strong>
                </div>
      
                <p style="margin-top: 24px;">Thank you for booking with ProBooker.</p>
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

    // 8. Return a success response
    return new Response(JSON.stringify({ success: true, ref: booking.booking_reference }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
    });

  } catch (error) {
    // 9. Return an error response
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }, 
    });
  }
})