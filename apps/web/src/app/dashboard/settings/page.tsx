"use client";

import { useState, useEffect } from "react";
import { QrCode, Smartphone, CheckCircle2, Loader2, RefreshCw, Settings, Save, Copy, Check, Wifi, AlertCircle } from "lucide-react";
import { TwoFactorSetupModal } from "@/components/settings/two-factor-setup-modal";

interface GatewayStatus {
  status: "open" | "connecting" | "close" | "disconnected";
  gatewayRunning: boolean;
}

interface QrResponse {
  qr: string | null;
}

export default function ConfigurationPage() {
  const [status, setStatus] = useState<GatewayStatus["status"]>("disconnected");
  const [gatewayRunning, setGatewayRunning] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [botNumber, setBotNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [twoFaSetup, setTwoFaSetup] = useState<{ uri: string; secret: string; email?: string } | null>(null);
  const [twoFaStatus, setTwoFaStatus] = useState<{ enabled: boolean; pending: boolean } | null>(null);
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [twoFaError, setTwoFaError] = useState("");
  const [disablePassword, setDisablePassword] = useState("");
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [disableLoading, setDisableLoading] = useState(false);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/gateway/status");
      const data: GatewayStatus = await res.json();
      setStatus(data.status || "disconnected");
      setGatewayRunning(Boolean(data.gatewayRunning));
    } catch (err) {
      console.error("Failed to fetch status:", err);
      setStatus("disconnected");
      setGatewayRunning(false);
    }
  };

  const fetchQr = async () => {
    try {
      const res = await fetch("/api/gateway/qr");
      if (res.ok) {
        const data: QrResponse = await res.json();
        setQrCode(data.qr);
      } else {
        setQrCode(null);
      }
    } catch (err) {
      setQrCode(null);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await fetch("/api/settings");
      if (res.ok) {
        const data = await res.json();
        setBotNumber(data.botNumber || "");
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ botNumber }),
      });
      if (res.ok) {
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const copyToClipboard = async () => {
    if (qrCode) {
      await navigator.clipboard.writeText(qrCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fetchTwoFaStatus = async () => {
    try {
      const res = await fetch("/api/auth/2fa/status");
      if (res.ok) {
        const data = await res.json();
        setTwoFaStatus({ enabled: Boolean(data.enabled), pending: Boolean(data.pending) });
      }
    } catch {
      /* ignore */
    }
  };

  const enableTwoFactor = async () => {
    if (twoFaStatus?.enabled) return;
    if (
      twoFaStatus?.pending &&
      !window.confirm(
        "Une configuration est déjà en cours. Relancer va générer une nouvelle clé — supprimez l'ancienne entrée dans votre app avant de continuer."
      )
    ) {
      return;
    }

    setTwoFaLoading(true);
    setTwoFaError("");
    try {
      const res = await fetch("/api/auth/2fa/setup", { method: "POST" });
      const data = await res.json();
      if (!res.ok || !data.uri) {
        setTwoFaError(data.error ?? "Impossible d'activer le 2FA");
        return;
      }
      setTwoFaSetup({ uri: data.uri, secret: data.secret, email: data.email });
      setTwoFaStatus({ enabled: false, pending: true });
    } catch {
      setTwoFaError("Erreur réseau");
    } finally {
      setTwoFaLoading(false);
    }
  };

  const disableTwoFactor = async () => {
    setDisableLoading(true);
    setTwoFaError("");
    try {
      const res = await fetch("/api/auth/2fa/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: disablePassword }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTwoFaError(data.error ?? "Impossible de désactiver le 2FA");
        return;
      }
      setTwoFaStatus({ enabled: false, pending: false });
      setShowDisableForm(false);
      setDisablePassword("");
    } catch {
      setTwoFaError("Erreur réseau");
    } finally {
      setDisableLoading(false);
    }
  };

  const reconnect = async () => {
    setQrCode(null);
    setStatus("connecting");
    try {
      await fetch("/api/gateway/reconnect", { method: "POST" });
    } catch {
      /* fetchStatus will reflect unreachable gateway */
    }
    await Promise.all([fetchStatus(), fetchQr()]);
  };

  useEffect(() => {
    const initialize = async () => {
      await Promise.all([fetchStatus(), fetchQr(), loadSettings(), fetchTwoFaStatus()]);
      setLoading(false);
    };
    initialize();

    const interval = setInterval(() => {
      fetchStatus();
      if (status !== "open") {
        fetchQr();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [status]);

  const getStatusBadge = () => {
    if (status === "open") {
      return (
        <div className="inline-flex items-center gap-2 rounded-full bg-green-500/10 px-4 py-2 text-sm font-semibold text-green-400 border border-green-500/30">
          <CheckCircle2 className="h-4 w-4" />
          Connecté
        </div>
      );
    } else if (status === "connecting") {
      return (
        <div className="inline-flex items-center gap-2 rounded-full bg-yellow-500/10 px-4 py-2 text-sm font-semibold text-yellow-400 border border-yellow-500/30">
          <Loader2 className="h-4 w-4 animate-spin" />
          Connexion en cours...
        </div>
      );
    } else {
      return (
        <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-400 border border-red-500/30">
          <AlertCircle className="h-4 w-4" />
          Déconnecté
        </div>
      );
    }
  };

  return (
    <div className="min-h-[calc(100vh-2rem)] space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Configuration</h1>
          <p className="text-white/60 mt-1">Gérez la connexion WhatsApp et les paramètres du bot</p>
        </div>
        <div>{getStatusBadge()}</div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* QR Code Section */}
        <div className="lg:col-span-2">
          <div className="relative overflow-hidden rounded-3xl border border-brand-blue-700/50 bg-gradient-to-br from-brand-blue-800/30 to-brand-blue-900/50 p-8 backdrop-blur-xl">
            <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-brand-yellow-500/10 blur-3xl"></div>
            <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-brand-blue-500/10 blur-3xl"></div>

            <div className="relative z-10">
              <div className="mb-8 flex items-center gap-4">
                <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-yellow-500 to-brand-yellow-600 text-brand-blue-950 shadow-lg shadow-brand-yellow-500/30">
                  <QrCode className="h-7 w-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Connexion WhatsApp</h2>
                  <p className="text-white/60">Scannez le QR code avec votre téléphone pour connecter le bot</p>
                </div>
              </div>

              <div className="grid gap-8 md:grid-cols-2 items-center">
                {/* QR Code Display */}
                <div className="flex flex-col items-center">
                  <div className="relative">
                    <div className={`absolute -inset-1 rounded-3xl bg-gradient-to-r from-brand-yellow-500 to-brand-blue-500 opacity-50 blur-lg ${status === "open" ? "animate-pulse" : ""}`}></div>
                    <div className="relative rounded-3xl border-4 border-white/10 bg-white p-6 shadow-2xl">
                      {loading ? (
                        <div className="flex h-64 w-64 items-center justify-center">
                          <Loader2 className="h-12 w-12 animate-spin text-brand-blue-500" />
                        </div>
                      ) : qrCode ? (
                        <img
                          src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrCode)}`}
                          alt="QR Code"
                          className="h-64 w-64"
                        />
                      ) : status === "open" ? (
                        <div className="flex h-64 w-64 flex-col items-center justify-center text-center">
                          <CheckCircle2 className="h-20 w-20 text-green-500 mb-4" />
                          <div className="text-xl font-bold text-gray-800">Connecté !</div>
                          <div className="text-sm text-gray-500 mt-2">Le bot WhatsApp est prêt à être utilisé</div>
                        </div>
                      ) : !gatewayRunning ? (
                        <div className="flex h-64 w-64 flex-col items-center justify-center text-center px-4">
                          <AlertCircle className="h-20 w-20 text-red-400 mb-4" />
                          <div className="text-xl font-bold text-gray-800">Gateway arrêté</div>
                          <div className="text-sm text-gray-500 mt-2">
                            Lancez <code className="text-xs bg-gray-100 px-1 rounded">pnpm dev:gateway</code> dans un terminal
                          </div>
                        </div>
                      ) : (
                        <div className="flex h-64 w-64 flex-col items-center justify-center text-center">
                          <AlertCircle className="h-20 w-20 text-red-400 mb-4" />
                          <div className="text-xl font-bold text-gray-800">Aucun QR code</div>
                          <div className="text-sm text-gray-500 mt-2">Cliquez sur Reconnecter pour générer un nouveau QR</div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-6 flex gap-3">
                    <button
                      onClick={reconnect}
                      disabled={status === "connecting"}
                      className="inline-flex items-center gap-2 rounded-xl border border-brand-yellow-500/30 bg-brand-yellow-500/10 px-6 py-3 font-semibold text-brand-yellow-500 transition-all hover:bg-brand-yellow-500 hover:text-brand-blue-950 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCw className={`h-5 w-5 ${status === "connecting" ? "animate-spin" : ""}`} />
                      Reconnecter
                    </button>
                    {qrCode && (
                      <button
                        onClick={copyToClipboard}
                        className="inline-flex items-center gap-2 rounded-xl border border-brand-blue-600 bg-brand-blue-700/50 px-6 py-3 font-semibold text-white transition-all hover:bg-brand-blue-600"
                      >
                        {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                        {copied ? "Copié !" : "Copier"}
                      </button>
                    )}
                  </div>
                </div>

                {/* Instructions */}
                <div className="space-y-6">
                  <div className="rounded-2xl border border-brand-blue-700/50 bg-brand-blue-800/30 p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                      <Smartphone className="h-5 w-5 text-brand-yellow-500" />
                      Instructions
                    </h3>
                    <ol className="space-y-3 text-white/70">
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow-500 text-xs font-bold text-brand-blue-950">1</span>
                        Ouvrez WhatsApp sur votre téléphone
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow-500 text-xs font-bold text-brand-blue-950">2</span>
                        Allez dans Paramètres &gt; Appareils connectés
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow-500 text-xs font-bold text-brand-blue-950">3</span>
                        Cliquez sur &quot;Connecter un appareil&quot;
                      </li>
                      <li className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-yellow-500 text-xs font-bold text-brand-blue-950">4</span>
                        Scannez le QR code avec votre appareil photo
                      </li>
                    </ol>
                  </div>

                  <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-6">
                    <div className="flex items-start gap-3">
                      <Wifi className="h-6 w-6 text-green-400 shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-bold text-green-400 mb-1">Conseil important</h4>
                        <p className="text-sm text-green-200/70">
                          Gardez votre téléphone connecté à internet pour que le bot fonctionne correctement.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Section */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-brand-blue-700/50 bg-gradient-to-br from-brand-blue-800/30 to-brand-blue-900/50 p-8 backdrop-blur-xl">
            <div className="mb-6 flex items-center gap-3">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-blue-600 to-brand-blue-700 text-white shadow-lg">
                <Settings className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Paramètres</h2>
                <p className="text-sm text-white/60">Configuration du bot</p>
              </div>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white/80">Numéro du bot</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={botNumber}
                    onChange={(e) => setBotNumber(e.target.value)}
                    placeholder="+225 01 23 45 67 89"
                    className="w-full rounded-xl border border-brand-blue-600 bg-brand-blue-900/50 px-4 py-3 text-white placeholder-white/40 focus:border-brand-yellow-500 focus:outline-none focus:ring-2 focus:ring-brand-yellow-500/20"
                  />
                </div>
                <p className="text-xs text-white/40">
                  Numéro de téléphone utilisé par le bot WhatsApp
                </p>
              </div>

              <button
                onClick={saveSettings}
                disabled={saving}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-yellow-500 to-brand-yellow-600 px-6 py-3 font-bold text-brand-blue-950 transition-all hover:from-brand-yellow-400 hover:to-brand-yellow-500 hover:shadow-lg hover:shadow-brand-yellow-500/30 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : saveSuccess ? (
                  <Check className="h-5 w-5" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
                {saving ? "Enregistrement..." : saveSuccess ? "Enregistré !" : "Enregistrer"}
              </button>
            </div>
          </div>

          {/* 2FA */}
          <div className="rounded-3xl border border-brand-blue-700/50 bg-brand-blue-800/20 p-6">
            <h3 className="font-semibold text-white mb-2">Authentification à deux facteurs</h3>
            <p className="text-sm text-white/60 mb-4">
              Activez le 2FA TOTP pour sécuriser votre compte admin (Google Authenticator, Authy…).
            </p>

            {twoFaStatus?.enabled && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-xl border border-success/30 bg-success/10 px-3 py-2 text-sm text-success">
                <CheckCircle2 className="h-4 w-4 shrink-0" />
                2FA activée sur ce compte
              </div>
            )}

            {twoFaStatus?.pending && !twoFaStatus.enabled && (
              <div className="mb-4 rounded-xl border border-brand-yellow-500/30 bg-brand-yellow-500/10 px-3 py-2 text-sm text-brand-yellow-500">
                Configuration en attente — scannez le QR et confirmez avec un code, ou relancez l&apos;activation.
              </div>
            )}

            <div className="flex flex-wrap gap-3">
              {!twoFaStatus?.enabled && (
                <button
                  type="button"
                  onClick={() => void enableTwoFactor()}
                  disabled={twoFaLoading}
                  className="rounded-xl border border-brand-yellow-500/30 bg-brand-yellow-500/10 px-4 py-2 text-sm font-medium text-brand-yellow-500 hover:bg-brand-yellow-500/20 disabled:opacity-50"
                >
                  {twoFaLoading ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Activation…
                    </span>
                  ) : twoFaStatus?.pending ? (
                    "Reprendre / régénérer le QR"
                  ) : (
                    "Activer 2FA"
                  )}
                </button>
              )}

              {twoFaStatus?.enabled && !showDisableForm && (
                <button
                  type="button"
                  onClick={() => setShowDisableForm(true)}
                  className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20"
                >
                  Désactiver le 2FA
                </button>
              )}
            </div>

            {showDisableForm && (
              <div className="mt-4 space-y-3 rounded-xl border border-white/10 bg-brand-blue-900/30 p-4">
                <p className="text-xs text-white/60">Confirmez avec votre mot de passe pour réinitialiser le 2FA.</p>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  placeholder="Mot de passe"
                  className="w-full rounded-xl border border-brand-blue-600 bg-brand-blue-900/50 px-4 py-2.5 text-sm text-white placeholder-white/40 focus:border-brand-yellow-500 focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => void disableTwoFactor()}
                    disabled={disableLoading || !disablePassword}
                    className="rounded-xl bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/30 disabled:opacity-50"
                  >
                    {disableLoading ? "Désactivation…" : "Confirmer la désactivation"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowDisableForm(false);
                      setDisablePassword("");
                    }}
                    className="rounded-xl border border-white/10 px-4 py-2 text-sm text-white/60 hover:text-white"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            )}

            {twoFaError && <p className="mt-3 text-xs text-red-400">{twoFaError}</p>}
          </div>

          {/* System Info */}
          <div className="rounded-3xl border border-brand-blue-700/50 bg-brand-blue-800/20 p-6">
            <h3 className="font-semibold text-white mb-4">Informations système</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-white/60">Gateway</span>
                <span className={gatewayRunning ? "text-green-400 font-mono" : "text-red-400 font-mono"}>
                  {gatewayRunning ? "En cours d'exécution" : "Arrêté (port 3001)"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Web App</span>
                <span className="text-white font-mono">Opérationnel</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TwoFactorSetupModal
        open={!!twoFaSetup}
        onClose={() => setTwoFaSetup(null)}
        onConfirmed={() => {
          setTwoFaStatus({ enabled: true, pending: false });
          void fetchTwoFaStatus();
        }}
        uri={twoFaSetup?.uri ?? ""}
        secret={twoFaSetup?.secret ?? ""}
        email={twoFaSetup?.email}
      />
    </div>
  );
}
