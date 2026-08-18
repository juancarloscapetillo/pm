import type { Metadata } from "next";
import Image from "next/image";
import {
  ShieldCheck,
  Waves,
  UtensilsCrossed,
  Clapperboard,
  Dumbbell,
  PawPrint,
  Warehouse,
  Bath,
  Bed,
  Ruler,
  Car,
  CheckCircle2,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Building2,
} from "lucide-react";
import Navbar from "@/components/muretto/Navbar";
import ContactForm from "@/components/muretto/ContactForm";

export const metadata: Metadata = {
  title: "Muretto — Departamentos en Temozón Norte, Mérida | Desarrolladora Calume",
  description:
    "Muretto: 70 nuevos departamentos de 1 y 2 recámaras en Temozón Norte, Mérida. Alberca, roof top, pet park y más. Desde $2,020,000 MXN. Un desarrollo de Desarrolladora Calume.",
  openGraph: {
    title: "Muretto — Tu vida, tu espacio",
    description: "70 nuevos departamentos de 1 y 2 recámaras en Temozón Norte, Mérida, Yucatán.",
    images: ["/muretto/renders/hero-entrada.jpg"],
  },
};

const AMENIDADES = [
  { icon: ShieldCheck, label: "Caseta de vigilancia" },
  { icon: Waves, label: "Alberca con área de solárium" },
  { icon: Clapperboard, label: "Sala de proyección" },
  { icon: UtensilsCrossed, label: "Roof top bar & grill" },
  { icon: Dumbbell, label: "Área de ejercicio al aire libre" },
  { icon: PawPrint, label: "Pet park" },
  { icon: Warehouse, label: "Bodega" },
  { icon: Bath, label: "Baños de área social" },
];

const MODELOS = [
  {
    nombre: "Modelo A1",
    recamaras: "2 recámaras",
    m2: "80 m²",
    descripcion: "Sala, comedor, cocina, área de lavado, baño de visitas, recámara secundaria y recámara principal con baño vestidor.",
  },
  {
    nombre: "Modelo A2",
    recamaras: "2 recámaras",
    m2: "80 m²",
    descripcion: "Misma distribución funcional que el A1, con orientación e iluminación propias dentro del conjunto.",
  },
  {
    nombre: "Modelo B/C",
    recamaras: "1 recámara",
    m2: "58–63 m²",
    descripcion: "Sala/comedor integrados, cocina, medio baño de visitas, recámara y baño completo. Ideal como primera vivienda o inversión.",
  },
];

const CERCANIAS = [
  "Parque Industrial",
  "Universidad Autónoma de Yucatán",
  "The Harbor Mall",
  "Liverpool",
  "Universidad Marista",
  "Universidad Mayab",
  "City Center",
  "Hospital Faro del Mayab",
  "La Isla",
  "Cabo Norte",
];

const EQUIPAMIENTO = [
  "Muros a 2.8 m de altura en todas las plantas",
  "Pisos de cerámica en todos los departamentos",
  "Cancelería residencial en color negro",
  "Puertas de madera de piso a techo",
  "Cocina con meseta de granito y gavetas inferiores",
  "Parrilla eléctrica y tarja de acero inoxidable",
];

const OTROS_PROYECTOS = ["Atrium", "Sieben", "Canova", "Magnolia", "Agua Nativa"];

const GALERIA = [
  { src: "/muretto/renders/hero-entrada.jpg", alt: "Acceso principal de Muretto al atardecer" },
  { src: "/muretto/renders/alberca-jardin.jpg", alt: "Alberca y jardín de Muretto al anochecer" },
  { src: "/muretto/renders/fachada-estacionamiento.jpg", alt: "Fachada de Muretto y estacionamiento techado" },
  { src: "/muretto/renders/fachada-detalle.jpg", alt: "Detalle de fachada de Muretto" },
];

export default function MurettoPage() {
  return (
    <div id="top" className="bg-white text-gray-900">
      <Navbar />

      {/* HERO */}
      <section className="relative h-[92vh] min-h-[640px] flex items-end">
        <Image
          src="/muretto/renders/hero-entrada.jpg"
          alt="Acceso principal de Muretto en Temozón Norte, Mérida"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-calume-navy via-calume-navy/60 to-calume-navy/20" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16 lg:pb-24 w-full">
          <p className="text-calume-gold text-sm font-semibold tracking-[0.2em] uppercase mb-4">
            Temozón Norte · Mérida, Yucatán
          </p>
          <h1 className="text-white font-extrabold text-5xl sm:text-6xl lg:text-7xl tracking-tight">
            MURETTO
          </h1>
          <p className="text-white/90 text-lg sm:text-xl mt-3 max-w-xl">
            Tu vida, <span className="italic font-light">tu espacio.</span>
          </p>
          <p className="text-white/70 mt-4 max-w-xl">
            70 nuevos departamentos de 1 y 2 recámaras en una de las zonas de mayor plusvalía y
            crecimiento de Mérida.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            <a href="#contacto" className="btn-gold px-6 py-3 text-base">
              Habla con un asesor
            </a>
            <a
              href="#modelos"
              className="btn px-6 py-3 text-base bg-white/10 text-white border border-white/30 hover:bg-white/20"
            >
              Ver modelos
            </a>
          </div>

          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-6 mt-14 max-w-3xl border-t border-white/20 pt-6">
            <div>
              <dt className="text-white/60 text-xs uppercase tracking-wide">Desde</dt>
              <dd className="text-white text-xl font-semibold mt-1">$2,020,000 MXN</dd>
            </div>
            <div>
              <dt className="text-white/60 text-xs uppercase tracking-wide">Departamentos</dt>
              <dd className="text-white text-xl font-semibold mt-1">70 unidades</dd>
            </div>
            <div>
              <dt className="text-white/60 text-xs uppercase tracking-wide">Recámaras</dt>
              <dd className="text-white text-xl font-semibold mt-1">1 y 2</dd>
            </div>
            <div>
              <dt className="text-white/60 text-xs uppercase tracking-wide">Entrega</dt>
              <dd className="text-white text-xl font-semibold mt-1">1ra 2026 · 2da 2027</dd>
            </div>
          </dl>
        </div>
      </section>

      {/* SOBRE EL PROYECTO */}
      <section id="proyecto" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
          <div className="relative aspect-[4/3] rounded-xl2 overflow-hidden shadow-popover">
            <Image
              src="/muretto/renders/fachada-detalle.jpg"
              alt="Detalle de fachada de Muretto"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="text-calume-gold text-sm font-semibold tracking-[0.2em] uppercase mb-3">
              El proyecto
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-calume-navy leading-tight">
              Un nuevo estándar de vida en Temozón Norte
            </h2>
            <p className="text-gray-600 mt-5 leading-relaxed">
              Mérida es considerada una de las ciudades con mayor plusvalía y crecimiento del país,
              y Temozón Norte es hoy una de sus zonas más buscadas. Muretto reúne 70 departamentos
              de 1 y 2 recámaras pensados para quienes buscan un espacio propio con acabados de
              calidad, amenidades reales y una ubicación estratégica.
            </p>
            <ul className="mt-8 space-y-3">
              {EQUIPAMIENTO.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-gray-700">
                  <CheckCircle2 size={18} className="text-calume-gold flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* AMENIDADES */}
      <section id="amenidades" className="scroll-mt-20 bg-gray-50 py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="order-2 lg:order-1">
              <p className="text-calume-goldDark text-sm font-semibold tracking-[0.2em] uppercase mb-3">
                Amenidades
              </p>
              <h2 className="text-3xl sm:text-4xl font-bold text-calume-navy leading-tight mb-8">
                Todo lo que necesitas, sin salir de casa
              </h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {AMENIDADES.map(({ icon: Icon, label }) => (
                  <div key={label} className="card flex items-center gap-3 p-4">
                    <span className="flex items-center justify-center h-10 w-10 rounded-full bg-calume-navy/5 text-calume-navy flex-shrink-0">
                      <Icon size={20} />
                    </span>
                    <span className="text-sm font-medium text-gray-800">{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="order-1 lg:order-2 relative aspect-[4/3] rounded-xl2 overflow-hidden shadow-popover">
              <Image
                src="/muretto/renders/alberca-jardin.jpg"
                alt="Alberca y jardín de Muretto"
                fill
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* GALERÍA */}
      <section id="galeria" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <p className="text-calume-gold text-sm font-semibold tracking-[0.2em] uppercase mb-3 text-center">
          Galería
        </p>
        <h2 className="text-3xl sm:text-4xl font-bold text-calume-navy leading-tight text-center mb-12">
          Conoce Muretto
        </h2>
        <div className="grid sm:grid-cols-2 gap-4 sm:gap-5">
          {GALERIA.map((img) => (
            <div key={img.src} className="relative aspect-[4/3] rounded-xl2 overflow-hidden group">
              <Image
                src={img.src}
                alt={img.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>

      {/* MODELOS */}
      <section id="modelos" className="scroll-mt-20 bg-calume-navy py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-calume-gold text-sm font-semibold tracking-[0.2em] uppercase mb-3 text-center">
            Modelos
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight text-center mb-4">
            Un espacio para cada forma de vivir
          </h2>
          <p className="text-white/60 text-center max-w-2xl mx-auto mb-14">
            Todos los departamentos incluyen cajón de estacionamiento techado. Precios y
            disponibilidad sujetos a cambio — consulta con un asesor para información actualizada.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {MODELOS.map((m) => (
              <div key={m.nombre} className="bg-white rounded-xl2 p-7 flex flex-col">
                <Building2 className="text-calume-gold" size={28} />
                <h3 className="text-xl font-bold text-calume-navy mt-4">{m.nombre}</h3>
                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                  <span className="flex items-center gap-1.5">
                    <Bed size={16} /> {m.recamaras}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Ruler size={16} /> {m.m2}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-4 leading-relaxed flex-1">{m.descripcion}</p>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-5 pt-5 border-t border-gray-100">
                  <Car size={16} /> Cajón de estacionamiento techado
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* UBICACIÓN */}
      <section id="ubicacion" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-start">
          <div>
            <p className="text-calume-gold text-sm font-semibold tracking-[0.2em] uppercase mb-3">
              Ubicación
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-calume-navy leading-tight mb-5">
              En el corazón de Temozón Norte
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              Muretto está a minutos de los puntos que ya forman parte de tu día a día: centros
              comerciales, universidades, hospitales y las principales vialidades de la ciudad.
            </p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
              {CERCANIAS.map((lugar) => (
                <div key={lugar} className="flex items-center gap-2 text-sm text-gray-700">
                  <MapPin size={15} className="text-calume-gold flex-shrink-0" />
                  {lugar}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl2 overflow-hidden shadow-popover aspect-[4/3] lg:aspect-auto lg:h-full min-h-[360px]">
            <iframe
              title="Ubicación de Muretto en Temozón Norte, Mérida"
              src="https://www.google.com/maps?q=Temoz%C3%B3n+Norte,+M%C3%A9rida,+Yucat%C3%A1n&output=embed"
              className="w-full h-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </section>

      {/* ESQUEMA DE PAGO */}
      <section className="bg-gray-50 py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-calume-goldDark text-sm font-semibold tracking-[0.2em] uppercase mb-3">
            Esquema de pago
          </p>
          <h2 className="text-3xl sm:text-4xl font-bold text-calume-navy leading-tight mb-14">
            Invertir en Muretto es simple
          </h2>
          <div className="grid sm:grid-cols-3 gap-6">
            {[
              { paso: "01", titulo: "Apartado", detalle: "$20,000 MXN para separar tu unidad." },
              { paso: "02", titulo: "Enganche", detalle: "25% del valor total del departamento." },
              { paso: "03", titulo: "Saldo", detalle: "El resto contra entrega, a la firma de escritura." },
            ].map((p) => (
              <div key={p.paso} className="card p-8">
                <div className="text-calume-gold text-4xl font-extrabold">{p.paso}</div>
                <h3 className="text-lg font-bold text-calume-navy mt-3">{p.titulo}</h3>
                <p className="text-sm text-gray-500 mt-2">{p.detalle}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-6">Pregunta por las promociones vigentes con tu asesor.</p>
        </div>
      </section>

      {/* CONTACTO */}
      <section id="contacto" className="scroll-mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20">
          <div>
            <p className="text-calume-gold text-sm font-semibold tracking-[0.2em] uppercase mb-3">
              Contacto
            </p>
            <h2 className="text-3xl sm:text-4xl font-bold text-calume-navy leading-tight mb-5">
              Agenda tu cita en sala de ventas
            </h2>
            <p className="text-gray-600 leading-relaxed mb-8">
              Un asesor te acompaña en todo el proceso: disponibilidad, precios, financiamiento y
              visita al departamento muestra.
            </p>
            <div className="space-y-4">
              <a
                href="https://wa.me/529999473074"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 text-gray-700 hover:text-calume-navy transition-colors"
              >
                <span className="flex items-center justify-center h-10 w-10 rounded-full bg-calume-navy/5 text-calume-navy">
                  <MessageCircle size={18} />
                </span>
                999 947 3074
              </a>
              <a
                href="mailto:calumemx@gmail.com"
                className="flex items-center gap-3 text-gray-700 hover:text-calume-navy transition-colors"
              >
                <span className="flex items-center justify-center h-10 w-10 rounded-full bg-calume-navy/5 text-calume-navy">
                  <Mail size={18} />
                </span>
                calumemx@gmail.com
              </a>
              <a
                href="tel:+529999473074"
                className="flex items-center gap-3 text-gray-700 hover:text-calume-navy transition-colors"
              >
                <span className="flex items-center justify-center h-10 w-10 rounded-full bg-calume-navy/5 text-calume-navy">
                  <Phone size={18} />
                </span>
                +52 999 947 3074
              </a>
            </div>
          </div>
          <div className="card p-6 sm:p-8">
            <ContactForm />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-calume-navyDark">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-8">
            <div>
              <Image
                src="/muretto/logo/muretto-logo.png"
                alt="Muretto"
                width={130}
                height={36}
                className="h-8 w-auto brightness-0 invert opacity-90"
              />
              <p className="text-white/50 text-sm mt-4 max-w-xs">
                Temozón Norte, Mérida, Yucatán. Un desarrollo de Desarrolladora Calume.
              </p>
            </div>
            <div>
              <p className="text-white/40 text-xs uppercase tracking-wide mb-3">
                Otros proyectos Calume
              </p>
              <div className="flex flex-wrap gap-x-5 gap-y-2">
                {OTROS_PROYECTOS.map((p) => (
                  <span key={p} className="text-white/60 text-sm">
                    {p}
                  </span>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col sm:flex-row justify-between gap-3 text-xs text-white/40">
            <p>© {new Date().getFullYear()} Desarrolladora Calume · www.calume.mx</p>
            <p>Las imágenes son renders ilustrativos, sujetos a cambios en el proyecto ejecutivo.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
