import Image from "next/image";
import Link from "next/link";
import FeaturedItems from "./FeaturedItems";
import ParallaxBackground from "./reserve/ParallaxBackground";

export default function Home() {
  return (
    <div className="relative flex flex-1 justify-center overflow-hidden bg-black font-(family-name:--font-cinzel) text-amber-100">
      <ParallaxBackground
        aria-hidden
        src="/bg.png"
        className="fixed inset-0 scale-110"
        style={{ filter: "blur(2px)" }}
      />
      <main
        className="relative flex w-full max-w-lg flex-col gap-4 px-4 pb-0 pt-6 lg:max-w-3xl xl:max-w-4xl"
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 z-10 w-2 bg-repeat-y"
          style={{ backgroundImage: "url(/border.png)", backgroundSize: "100% auto" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 z-10 w-2 -scale-x-100 bg-repeat-y"
          style={{ backgroundImage: "url(/border.png)", backgroundSize: "100% auto" }}
        />
        <Image
          src="/promo.jpg"
          alt="Ælyxyr & Vjhn – The Miracle Rate: bottomless elixyrs for ₱350, Oct 1 - Nov 30 only"
          width={764}
          height={815}
          priority
          className="-mx-4 -mt-6 w-[calc(100%+2rem)] max-w-none"
        />

        <Link href="/reserve" className="block transition hover:brightness-110 active:scale-[0.99]">
          <Image
            src="/icons/btn-reserve.png"
            alt="Reserve my chalice"
            width={730}
            height={80}
            className="h-auto w-full"
          />
        </Link>
        <div className="grid grid-cols-2 gap-3">
          <a href="#" className="block transition hover:brightness-110 active:scale-[0.99]">
            <Image src="/icons/btn-menu.png" alt="View menu" width={360} height={70} className="h-auto w-full" />
          </a>
          <a href="#" className="block transition hover:brightness-110 active:scale-[0.99]">
            <Image src="/icons/btn-event_info.png" alt="Event info" width={360} height={70} className="h-auto w-full" />
          </a>
        </div>

        <section>
          <Image
            src="/icons/title-featured_elixyrs.png"
            alt="Featured Elixyrs – a taste of what awaits"
            width={1536}
            height={223}
            className="h-auto w-full"
          />
          <FeaturedItems
            items={[
              {
                src: "/item-drink-milktea.png",
                alt: "Nectyr of the Seraphæ – amber tea and sweet cream entwined into a nectar befitting the Seraphæ",
              },
              {
                src: "/item-drink-juice.png",
                alt: "Crimson Covenant – crimson fruits and enchanted berries swirling with violet stardust",
              },
              {
                src: "/item-drink-coffee.png",
                alt: "Noctyrnum – dark roast and velvet cream kissed by silver moonlight",
              },
            ]}
          />
        </section>

        <div className="mt-4 flex flex-col items-center gap-3 pb-16 text-center text-xs tracking-widest text-amber-200/90">
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <br></br>
          <div>
            <p className="text-[10px] italic tracking-[0.3em] text-amber-200/70">
              Conjured in Alliance With
            </p>
            <p className="mt-1 text-2xl tracking-[0.2em] text-amber-100 drop-shadow-[0_0_8px_rgba(255,236,179,0.45)]">
              <a
                href="https://www.facebook.com/p/Aurora-Ball-61575189387126/"
                target="_blank"
                rel="noopener noreferrer"
                className="transition hover:text-amber-300"
              >
                AURORA BALL 2026
              </a>
            </p>
          </div>
          <div>
            <p>FERNWOOD GARDENS TAGAYTAY</p>
            <p className="text-[10px] italic tracking-[0.3em] text-amber-200/70">
              <a
                href="https://www.google.com/maps/search/?api=1&query=Fernwood+Gardens+Tagaytay"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-amber-300"
              >
                NEOGAN, TAGAYTAY CITY, CAVITE
              </a>
            </p>
          </div>
          <br></br>
          <div>
            <p className="text-[10px] italic tracking-[0.3em] text-amber-200/70">
              Brewing on
            </p>
            <p>DECEMBER 13, 2026</p>
          </div>

            <br />
            <br />

          <p>
            <a href="tel:+639762841349" className="hover:text-amber-300">+63 976 284 1349</a>
            {" · "}
            <a href="mailto:aelyxyr.and.vjhn@gmail.com" className="hover:text-amber-300">aelyxyr.and.vjhn@gmail.com</a>
          </p>

            <br />
            <br />
            <br />

          {/* TODO: restore social links once ready. Aurora Ball pages:
              Instagram https://www.instagram.com/auroraball.ph/
              Facebook  https://www.facebook.com/p/Aurora-Ball-61575189387126/
              TikTok    https://www.tiktok.com/@aurora.ball.ph */}
          <p className="text-[10px] text-amber-200/70">
            MUST BE 18+ TO ATTEND. DRINK RESPONSIBLY.
          </p>
          <p className="text-[10px] text-amber-200/70">
            © 2026 ÆLYXYR &amp; VJHN
          </p>
        </div>

        <Image
            src="/icons/footer-message.png"
            alt="From six vessels floweth wonder."
            width={1480}
            height={520}
            className="mx-auto h-auto w-[45%]"
          />

        <footer className="relative -mx-4 -mt-16 w-[calc(100%+2rem)]">
          <Image
            src="/footer.png"
            alt=""
            width={763}
            height={289}
            className="h-auto w-full max-w-none"
          />
          <nav className="absolute inset-x-0 top-[50%] grid h-[35%] grid-cols-5">
            {["Home", "Menu", "Pass", "Orders", "Profile"].map((l) => (
              <a key={l} href="#" aria-label={l} />
            ))}
          </nav>
        </footer>
      </main>
    </div>
  );
}
