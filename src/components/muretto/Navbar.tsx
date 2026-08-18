"use client";

import { useState } from "react";
import Image from "next/image";
import { Menu, X } from "lucide-react";

const LINKS = [
  { href: "#proyecto", label: "El proyecto" },
  { href: "#amenidades", label: "Amenidades" },
  { href: "#galeria", label: "Galería" },
  { href: "#modelos", label: "Modelos" },
  { href: "#ubicacion", label: "Ubicación" },
  { href: "#contacto", label: "Contacto" },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed top-0 inset-x-0 z-50 bg-muretto-navy/95 backdrop-blur supports-[backdrop-filter]:bg-muretto-navy/80 border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <a href="#top" className="flex items-center gap-2 flex-shrink-0">
            <Image
              src="/muretto/logo/muretto-logo.png"
              alt="Muretto"
              width={140}
              height={49}
              className="h-7 lg:h-8 w-auto brightness-0 invert"
              priority
            />
          </a>

          <nav className="hidden lg:flex items-center gap-8">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-white/80 hover:text-white transition-colors"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="hidden lg:block">
            <a href="#contacto" className="btn-muretto">
              Agenda tu cita
            </a>
          </div>

          <button
            className="lg:hidden text-white p-2 -mr-2"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
          >
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-muretto-navy">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="text-sm font-medium text-white/80 hover:text-white py-2.5"
              >
                {link.label}
              </a>
            ))}
            <a href="#contacto" onClick={() => setOpen(false)} className="btn-muretto mt-2 justify-center">
              Agenda tu cita
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}
