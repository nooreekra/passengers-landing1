import './globals.css';
import 'react-toastify/dist/ReactToastify.css';
import {Roboto, Inter, Play, Caveat} from 'next/font/google';
import type {Metadata} from 'next';
import {Providers} from "@/shared/providers/Providers";
import IdleLogout from "@/shared/ui/IdleLogout";


const roboto = Roboto({subsets: ['latin'], weight: ['400', '500', '700'], variable: '--font-roboto'});
const inter = Inter({subsets: ['latin'], variable: '--font-inter'});
// Story Script импортируется через @import в globals.css, так как его нет в next/font/google
const storyScript = { variable: '--font-story-script' };
const play = Play({subsets: ['latin'], weight: ['400', '700'], variable: '--font-play'});
const caveat = Caveat({subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-caveat'});

export const metadata: Metadata = {
    title: 'IMS Savvy',
    description: 'Global Loyalty Platform for Airlines, Agencies and Travel Agents',
};

export default function RootLayout({
                                       children,
                                   }: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" className={`${roboto.variable} ${inter.variable} ${storyScript.variable} ${play.variable} ${caveat.variable}`}>
        <body className={roboto.className}>
           <Providers>
               <IdleLogout />
               {children}
           </Providers>
        </body>
        </html>
    );
}
