import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { headers } from 'next/headers';

export async function GET() {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
  const baseUrl = `${protocol}://${host}`;

  const albumDir = path.join(process.cwd(), 'public/album');
  const files = fs.readdirSync(albumDir)
    .filter(file => file.toLowerCase().endsWith('.jpg'))
    .map(file => `${baseUrl}/album/${file}`);
    
  return NextResponse.json(files);
}
