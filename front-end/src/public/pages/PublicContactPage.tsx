import React, { useState, useEffect } from 'react';
import { mockApi } from '../../services/mockApi';
import { PublicPortalSettings } from '../../types';
import { APP_NAME } from '../../config/branding';
import { Button, Input, Label, Select, Spinner, Textarea } from '../../components/ui';

export const PublicContactPage: React.FC = () => {
  const [settings, setSettings] = useState<PublicPortalSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Simple contact form state
  const [formData, setFormData] = useState({
    nom: '',
    contact: '',
    objet: 'Renseignement collecte',
    message: '',
  });
  const [isSent, setIsSent] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    mockApi.getPublicSettings().then((res) => {
      setSettings(res);
      setIsLoading(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nom || !formData.message) return;

    setIsSubmitting(true);
    setErrorMessage(null);
    try {
      await mockApi.sendContactMessage({
        nom: formData.nom.trim(),
        contact: formData.contact.trim() || undefined,
        objet: formData.objet,
        message: formData.message.trim(),
      });
      setIsSent(true);
      setFormData({
        nom: '',
        contact: '',
        objet: 'Renseignement collecte',
        message: '',
      });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Le message n'a pas pu être envoyé. Réessayez plus tard.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3">
        <Spinner className="w-8 h-8 border-3" />
        <span className="text-xs text-[#777585]">Chargement des informations...</span>
      </div>
    );
  }

  const cleanWhatsapp = (settings?.contact_whatsapp || '').replace(/[^\d]/g, '');

  return (
    <div className="flex flex-col gap-6 max-w-4xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col gap-2">
        <span className="text-[11px] font-mono font-bold text-primary uppercase tracking-wider">
          Portail communautaire
        </span>
        <h1 className="font-sora text-2xl sm:text-3xl font-bold text-[#181c20]">
          À propos & Contact du Collectif
        </h1>
        <p className="text-xs sm:text-sm text-[#777585]">
          Informations officielles et permanence gérées par les administrateurs de la caisse.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-5">
        {/* Left Column: About Us & Contact details */}
        <div className="md:col-span-7 flex flex-col gap-6">
          {/* About Us Card */}
          <section className="bg-white rounded-[28px] p-5 sm:p-6 border border-[#eceef3] shadow-xs flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-primary/10 text-primary flex items-center justify-center">
                <span className="material-symbols-outlined text-[20px]">diversity_3</span>
              </div>
              <h2 className="font-sora text-lg font-bold text-[#181c20]">
                À propos de nous
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-[#464554] leading-relaxed">
              {settings?.about_us ||
                `${APP_NAME} est une initiative associative et communautaire fondée pour favoriser l'entraide financière, les tontines transparentes et le financement participatif local. Chaque contribution fait l'objet d'une traçabilité rigoureuse.`}
            </p>

            <div className="pt-3 border-t border-[#eceef3] flex items-center gap-3 text-xs text-[#777585]">
              <span className="material-symbols-outlined text-primary text-[18px]">verified_user</span>
              <span>Comptabilité transparente contrôlée collégialement</span>
            </div>
          </section>

          {/* Official Coordinates Card */}
          <section className="bg-white rounded-[28px] p-5 sm:p-6 border border-[#eceef3] shadow-xs flex flex-col gap-4">
            <h3 className="font-sora text-base font-bold text-[#181c20]">
              Coordonnées de la trésorerie
            </h3>

            <div className="flex flex-col gap-4 text-xs">
              {/* WhatsApp direct */}
              {settings?.contact_whatsapp && (
                <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100">
                  <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <span className="material-symbols-outlined text-[18px]">chat</span>
                  </div>
                  <div className="flex flex-col flex-1">
                    <span className="text-[10px] uppercase font-bold text-emerald-800">
                      WhatsApp officiel
                    </span>
                    <a
                      href={`https://wa.me/${cleanWhatsapp}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono font-bold text-emerald-900 hover:underline mt-0.5"
                    >
                      {settings.contact_whatsapp}
                    </a>
                    <span className="text-[10px] text-emerald-700 mt-0.5">
                      Réponse rapide pour les cotisations & attestations
                    </span>
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#f7f9fe] border border-[#eceef3]">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">mail</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#777585]">
                    Courriel officiel
                  </span>
                  <a
                    href={`mailto:${settings?.contact_email || 'contact@roundpay.org'}`}
                    className="font-medium text-[#181c20] hover:text-primary mt-0.5"
                  >
                    {settings?.contact_email || 'contact@roundpay.org'}
                  </a>
                </div>
              </div>

              {/* Phone */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#f7f9fe] border border-[#eceef3]">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">call</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#777585]">
                    Téléphone
                  </span>
                  <a
                    href={`tel:${settings?.contact_phone || '+33600000000'}`}
                    className="font-medium text-[#181c20] hover:text-primary mt-0.5"
                  >
                    {settings?.contact_phone || '+33 6 45 12 98 33'}
                  </a>
                </div>
              </div>

              {/* Physical Address */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#f7f9fe] border border-[#eceef3]">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">location_on</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#777585]">
                    Adresse & Permanence
                  </span>
                  <span className="font-medium text-[#181c20] mt-0.5">
                    {settings?.contact_adresse || '14 Rue de la Fraternité, Paris'}
                  </span>
                </div>
              </div>

              {/* Hours */}
              <div className="flex items-start gap-3 p-3 rounded-2xl bg-[#f7f9fe] border border-[#eceef3]">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <span className="material-symbols-outlined text-[18px]">schedule</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] uppercase font-bold text-[#777585]">
                    Horaires de permanence
                  </span>
                  <span className="font-medium text-[#181c20] mt-0.5">
                    {settings?.contact_horaires || 'Permanence chaque samedi de 14h à 18h'}
                  </span>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Column: Contact Message Form */}
        <div className="md:col-span-5">
          <section className="bg-white rounded-[28px] p-5 sm:p-6 border border-[#eceef3] shadow-xs flex flex-col gap-4 sticky top-24">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[20px] text-primary">send</span>
              <h3 className="font-sora text-base font-bold text-[#181c20]">
                Écrire à la trésorerie
              </h3>
            </div>
            <p className="text-xs text-[#777585]">
              Une question sur une collecte ou un don Mobile Money ? Envoyez-nous un message direct.
            </p>

            {isSent ? (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center flex flex-col items-center gap-2 animate-in zoom-in-95">
                <span className="material-symbols-outlined text-emerald-600 text-[32px]">
                  mark_email_read
                </span>
                <span className="font-bold text-xs text-emerald-900">
                  Message bien transmis !
                </span>
                <p className="text-[11px] text-emerald-700">
                  L'équipe administrative a reçu votre message et reviendra vers vous sous 24h.
                </p>
                <button
                  type="button"
                  onClick={() => setIsSent(false)}
                  className="mt-2 text-xs font-bold text-emerald-800 hover:underline"
                >
                  Envoyer un autre message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
                <div>
                  <Label htmlFor="contact-nom">Votre nom complet *</Label>
                  <Input
                    id="contact-nom"
                    type="text"
                    required
                    placeholder="Ex: Jean Dupont"
                    value={formData.nom}
                    onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-coordonnees">Email ou Téléphone *</Label>
                  <Input
                    id="contact-coordonnees"
                    type="text"
                    required
                    placeholder="Ex: +33 6... ou email@domaine.com"
                    value={formData.contact}
                    onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                    className="bg-white"
                  />
                </div>

                <div>
                  <Label htmlFor="contact-objet">Objet</Label>
                  <Select
                    id="contact-objet"
                    value={formData.objet}
                    onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                    className="bg-white"
                  >
                    <option value="Renseignement collecte">Renseignement sur une collecte</option>
                    <option value="Confirmation Mobile Money">Confirmation de virement Mobile Money</option>
                    <option value="Demande d'adhésion">Demande pour devenir membre du collectif</option>
                    <option value="Autre">Autre demande</option>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="contact-message">Message *</Label>
                  <Textarea
                    id="contact-message"
                    required
                    rows={4}
                    placeholder="Votre question ou message..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  />
                </div>

                {errorMessage && (
                  <p role="alert" className="text-xs font-semibold text-red-700 bg-red-50 rounded-xl px-3 py-2">
                    {errorMessage}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  size="lg"
                  className="w-full shadow-xs"
                >
                  {isSubmitting ? (
                    <span>Envoi en cours...</span>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[16px]">send</span>
                      <span>Envoyer mon message</span>
                    </>
                  )}
                </Button>
              </form>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
