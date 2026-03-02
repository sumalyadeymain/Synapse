import { NextResponse } from 'next/server';

export async function POST(req: Request) {
    const response = NextResponse.redirect(new URL('/', req.url), 303);
    response.cookies.delete('local_session');
    return response;
}
