import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  "/",
  '/sign-in(.*)',
   '/sign-up(.*)',
   '/api/inngest(.*)'
  
])

export default clerkMiddleware( async (auth , req) =>{
    //agar koi bhi url jo public route mai nahi hai usse app ko protect kro which basically means those url's would not be loaded if user is not signed in
    if(!(isPublicRoute(req))){
        await auth.protect()
    }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};