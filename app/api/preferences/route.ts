import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';


export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const userDoc = await User.findOne({ email: user.email }).select('preferences');

    if (!userDoc) {
      const newUser = await User.create({
        email: user.email,
        name: user.name,
        preferences: {
          categories: ['general'],
          language: 'en',
          country: 'us',
        },
      });
      return NextResponse.json({
        success: true,
        preferences: newUser.preferences,
      });
    }

    return NextResponse.json({
      success: true,
      preferences: userDoc.preferences,
    });
  } catch (error) {
    console.error('Fetch preferences error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to fetch preferences' },
      { status: 500 }
    );
  }
}


export async function PUT(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { categories, language, country } = body;

    await connectDB();

    const updateData: any = {};
    if (categories) updateData['preferences.categories'] = categories;
    if (language) updateData['preferences.language'] = language;
    if (country) updateData['preferences.country'] = country;


    let userDoc = await User.findOne({ email: user.email });

    if (!userDoc) {
      userDoc = await User.create({
        email: user.email,
        name: user.name,
        password: 'oauth',
        preferences: {
          categories: categories || ['general'],
          language: language || 'en',
          country: country || 'us',
        },
      });
    } else {
      const updatedUser = await User.findOneAndUpdate(
        { email: user.email },
        { $set: updateData },
        { new: true, runValidators: true }
      );
      
      if (!updatedUser) {
        return NextResponse.json(
          { success: false, message: 'Failed to update user' },
          { status: 500 }
        );
      }
      
      userDoc = updatedUser;
    }

    return NextResponse.json({
      success: true,
      preferences: userDoc.preferences,
      message: 'Preferences updated successfully',
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to update preferences' },
      { status: 500 }
    );
  }
}
