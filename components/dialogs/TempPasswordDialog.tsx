"use client";

import { useState } from "react";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { postApi } from "@/lib/api-client";
import { encryptPasswordWithTicket } from "@/lib/crypto";

interface TempPasswordDialogProps {
  deviceId: string;
  onSuccess: () => void;
}

export default function TempPasswordDialog({
  deviceId,
  onSuccess,
}: TempPasswordDialogProps) {
  const [form, setForm] = useState({
    name: "",
    password: "",
    effective_time: "",
    invalid_time: "",
    oneTime: false,
    phone: "",
    sendSms: false,
  });

  const [loading, setLoading] = useState(false);

  const handleCreatePassword = async () => {
    if (
      !form.name ||
      !form.password ||
      !form.effective_time ||
      !form.invalid_time
    ) {
      return toast.error(
        "Name, password, start time, and end time are required"
      );
    }

    // Validate password length (7 for Wi-Fi locks)
    if (form.password.length !== 7) {
      return toast.error(
        "Password must be exactly 7 characters for Wi-Fi locks"
      );
    }

    setLoading(true);

    try {
      // 1️⃣ Get ticket from server
      const ticketRes = await fetch(
        `/api/devices/${deviceId}/password-ticket`,
        { method: "POST" }
      );
      const ticketJson = await ticketRes.json();

      if (!ticketJson.success || !ticketJson.result?.plainTicketKey) {
        throw new Error(ticketJson.message || "Failed to get ticket");
      }

      const { plainTicketKey, ticket_id } = ticketJson.result;

      // 2️⃣ Encrypt password
      const encryptedPwd = encryptPasswordWithTicket(
        form.password,
        plainTicketKey
      ).toUpperCase();

      // 3️⃣ Convert times to UNIX seconds
      const effectiveTs = Math.floor(
        new Date(form.effective_time).getTime() / 1000
      );
      const invalidTs = Math.floor(
        new Date(form.invalid_time).getTime() / 1000
      );

      // 4️⃣ Build payload for template temp password
      const payload = {
        name: form.name,
        password: encryptedPwd,
        password_type: "ticket",
        ticket_id,
        effective_time: effectiveTs,
        invalid_time: invalidTs,
        type: form.oneTime ? 1 : 0,
        phone: form.phone || undefined,
        check_name: true,
        is_record: true,
      };

      // 5️⃣ Post to API
      const response = await postApi(
        `/api/devices/${deviceId}/temp-password`,
        payload
      );

      toast.success(
        `Temporary password created successfully${
          response.result?.pwd_id ? ` (ID: ${response.result.pwd_id})` : ""
        }`
      );

      onSuccess();
      setForm({
        name: "",
        password: "",
        effective_time: "",
        invalid_time: "",
        oneTime: false,
        phone: "",
        sendSms: false,
      });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Create Temporary Password</DialogTitle>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div>
          <Label>Name</Label>
          <Input
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="e.g. Guest Access"
            disabled={loading}
          />
        </div>

        <div>
          <Label>Password (7 characters)</Label>
          <Input
            type="text"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="1234567"
            maxLength={7}
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            Must be exactly 7 characters
          </p>
        </div>

        <div>
          <Label>Start Time</Label>
          <Input
            type="datetime-local"
            value={form.effective_time}
            onChange={(e) =>
              setForm({ ...form, effective_time: e.target.value })
            }
            disabled={loading}
          />
        </div>

        <div>
          <Label>End Time</Label>
          <Input
            type="datetime-local"
            value={form.invalid_time}
            onChange={(e) => setForm({ ...form, invalid_time: e.target.value })}
            disabled={loading}
          />
        </div>

        <div>
          <Label>Phone Number (optional)</Label>
          <Input
            type="tel"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="+1234567890"
            disabled={loading}
          />
          <p className="text-xs text-muted-foreground mt-1">
            For SMS notifications (if supported)
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="one-time"
            checked={form.oneTime}
            onChange={(e) => setForm({ ...form, oneTime: e.target.checked })}
            className="rounded"
            disabled={loading}
          />
          <Label htmlFor="one-time" className="cursor-pointer">
            One-time use only
          </Label>
        </div>

        <Button
          onClick={handleCreatePassword}
          disabled={loading}
          className="w-full"
        >
          {loading ? "Creating password…" : "Create Password"}
        </Button>
      </div>
    </DialogContent>
  );
}
