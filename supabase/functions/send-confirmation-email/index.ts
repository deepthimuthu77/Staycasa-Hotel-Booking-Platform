// supabase/functions/send-confirmation-email/index.ts

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Resend } from 'https://esm.sh/resend@3.2.0'

// Helper function to format currency
function formatCurrency(amount: number, currency: string = "INR"): string {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: currency, 
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Helper function to format date
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

Deno.serve(async (req) => {
  // 1. Get secrets (using the new custom names)
  const supabaseUrl = Deno.env.get('PUBLIC_SUPABASE_URL')!;
  const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!;
  const resendApiKey = Deno.env.get('RESEND_API_KEY')!;
  const resend = new Resend(resendApiKey);

  // 2. Create a Supabase client
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

  // 3. Get the booking_id from the request body
  const { booking_id } = await req.json();
  if (!booking_id) {
    return new Response(JSON.stringify({ error: 'booking_id is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // 4. Fetch the complete booking data
    const { data: booking, error } = await supabaseAdmin
      .from('bookings')
      .select(`
        *,
        users (email, full_name),
        hotels (name, address)
      `)
      .eq('id', booking_id)
      .single();

    if (error) throw new Error(error.message);
    if (!booking) throw new Error('Booking not found');

    // 5. Extract data for the email
    const user = booking.users as { email: string; full_name: string };
    const hotel = booking.hotels as { name: string; address: { street: string; city: string } };
    
    if (!user || !user.email) throw new Error('User or email not found for this booking');
    if (!hotel) throw new Error('Hotel not found for this booking');

    const checkIn = formatDate(booking.check_in);
    const checkOut = formatDate(booking.check_out);
    const total = formatCurrency(booking.price_breakdown.total, booking.currency);
    const hotelAddress = `${hotel.address.street}, ${hotel.address.city}`;

    // 6. Send the email using Resend
    await resend.emails.send({
      from: 'ProBooker <booking@yourdomain.com>', // MUST be a verified domain on Resend
      to: [user.email],
      subject: `Your Booking is Confirmed! (Ref: ${booking.booking_reference})`,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2>Booking Confirmed!</h2>
          <p>Hello ${user.full_name || 'Guest'},</p>
          <p>Your booking at <strong>${hotel.name}</strong> is confirmed. We can't wait to host you!</p>
          
          <hr>
          <h3>Your Booking Details:</h3>
          <ul>
            <li><strong>Reference:</strong> ${booking.booking_reference}</li>
            <li><strong>Hotel:</strong> ${hotel.name}</li>
            <li><strong>Address:</strong> ${hotelAddress}</li>
            <li><strong>Check-in:</strong> ${checkIn}</li>
            <li><strong>Check-out:</strong> ${checkOut}</li>
            <li><strong>Total Paid:</strong> ${total}</li>
          </ul>
          <hr>
          
          <p>Thank you for booking with ProBooker.</p>
        </div>
      `,
    });

    // 7. Return a success response
    return new Response(JSON.stringify({ success: true, ref: booking.booking_reference }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    // 8. Return an error response
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
})