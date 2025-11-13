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
import { decryptTicketKey, encryptPasswordWithTicket } from "@/lib/crypto";
import { TUYA_ACCESS_KEY } from "@/lib/constants";

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
    type: 0, // 0 = reusable, 1 = one‑time
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (
      !form.name ||
      !form.password ||
      !form.effective_time ||
      !form.invalid_time
    ) {
      return toast.error("All fields are required");
    }

    setLoading(true);
    try {
      // 1. Get ticket
      const ticketRes = await fetch(
        `/api/devices/${deviceId}/password-ticket`,
        { method: "POST" }
      );
      const ticketJson = await ticketRes.json();
      if (!ticketJson.success) throw new Error(ticketJson.message);

      const { ticket_id, ticket_key } = ticketJson.result;

      // 2. Decrypt ticket_key
      const plainTicketKey = decryptTicketKey(ticket_key, TUYA_ACCESS_KEY);

      // 3. Encrypt user password
      const encryptedPwd = encryptPasswordWithTicket(
        form.password,
        plainTicketKey
      );

      // 4. Build payload for temp‑password API
      const payload = {
        name: form.name,
        password: encryptedPwd,
        effective_time: Math.floor(
          new Date(form.effective_time).getTime() / 1000
        ),
        invalid_time: Math.floor(new Date(form.invalid_time).getTime() / 1000),
        password_type: "ticket",
        ticket_id,
        type: form.type ? 1 : 0,
        relate_dev_list: [deviceId],
      };

      await postApi(`/api/devices/${deviceId}/temp-password`, payload);
      toast.success("Temporary password created");
      onSuccess();
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
          />
        </div>

        <div>
          <Label>Password</Label>
          <Input
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            placeholder="Enter password"
          />
        </div>

        <div>
          <Label>Start Time</Label>
          <Input
            type="datetime-local"
            value={form.effective_time}
            onChange={(e) =>
              setForm({ ...form, effective_time: e.target.value })
            }
          />
        </div>

        <div>
          <Label>End Time</Label>
          <Input
            type="datetime-local"
            value={form.invalid_time}
            onChange={(e) => setForm({ ...form, invalid_time: e.target.value })}
          />
        </div>

        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="one-time"
            checked={form.type === 1}
            onChange={(e) =>
              setForm({ ...form, type: e.target.checked ? 1 : 0 })
            }
            className="rounded"
          />
          <Label htmlFor="one-time" className="cursor-pointer">
            One‑time use only
          </Label>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? "Creating…" : "Create Password"}
        </Button>
      </div>
    </DialogContent>
  );
}
