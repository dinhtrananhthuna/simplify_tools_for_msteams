import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json();
    
    const validUsername = process.env.ADMIN_USERNAME || 'admin';
    const validPassword = process.env.ADMIN_PASSWORD || 'password';
    
    console.log('🔐 Login attempt for user:', username);
    console.log('🔧 Expected username:', validUsername);
    console.log('🔧 Expected password:', validPassword ? '***' : 'NOT SET');
    
    if (username === validUsername && password === validPassword) {
      console.log('✅ Login successful');
      return NextResponse.json({ 
        success: true, 
        message: 'Login successful' 
      });
    } else {
      console.log('❌ Invalid credentials');
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid credentials' 
      }, { status: 401 });
    }
  } catch (error) {
    console.error('❌ Login error:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Login failed' 
    }, { status: 500 });
  }
} 