"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "529999473074";

export default function ContactForm() {
  const [nombre, setNombre] = useState("");
  const [telefono, setTelefono] = useState("");
  const [interes, setInteres] = useState("2 recámaras");
  const [mensaje, setMensaje] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const lines = [
      `Hola, me llamo ${nombre || "—"} y me interesa Muretto.`,
      `Teléfono: ${telefono || "—"}`,
      `Me interesa un depa de: ${interes}`,
    ];
    if (mensaje.trim()) lines.push(`Mensaje: ${mensaje.trim()}`);
    const text = encodeURIComponent(lines.join("\n"));
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${text}`, "_blank", "noopener,noreferrer");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label className="label">Nombre</label>
          <input
            required
            className="input"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Tu nombre"
          />
        </div>
        <div>
          <label className="label">Teléfono</label>
          <input
            required
            type="tel"
            className="input"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            placeholder="999 000 0000"
          />
        </div>
      </div>
      <div>
        <label className="label">Me interesa</label>
        <select className="input" value={interes} onChange={(e) => setInteres(e.target.value)}>
          <option>1 recámara</option>
          <option>2 recámaras</option>
          <option>Aún no lo sé</option>
        </select>
      </div>
      <div>
        <label className="label">Mensaje (opcional)</label>
        <textarea
          className="input"
          rows={3}
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          placeholder="Cuéntanos qué buscas..."
        />
      </div>
      <button type="submit" className="btn-gold w-full">
        <MessageCircle size={18} />
        Enviar por WhatsApp
      </button>
      <p className="text-xs text-gray-400 text-center">
        Al enviar, se abrirá WhatsApp con tus datos para que un asesor te contacte directamente.
      </p>
    </form>
  );
}
