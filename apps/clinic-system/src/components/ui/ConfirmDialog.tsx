"use client";
import { useTranslations } from "next-intl";
import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle } from "lucide-react";

interface ConfirmDialogProps {
  isOpen: boolean; onClose: () => void; onConfirm: () => void;
  title?: string; message?: string; loading?: boolean;
}

export default function ConfirmDialog({ isOpen, onClose, onConfirm, title, message, loading }: ConfirmDialogProps) {
  const t = useTranslations("common");
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="sm"
      footer={<>
        <Button variant="secondary" onClick={onClose} disabled={loading}>{t("cancel")}</Button>
        <Button variant="danger" onClick={onConfirm} loading={loading}>{t("delete")}</Button>
      </>}>
      <div className="flex flex-col items-center gap-4 py-3 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-500/15 border border-red-500/25">
          <AlertTriangle className="h-7 w-7 text-red-400" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-white">{title ?? t("confirmDelete")}</h3>
          <p className="text-sm text-slate-400 mt-1">{message ?? t("deleteWarning")}</p>
        </div>
      </div>
    </Modal>
  );
}
