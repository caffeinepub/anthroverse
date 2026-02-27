import React, { useState } from "react";
import {
  Calendar, Clock, MapPin, Coffee, Palette, Mic, Shirt, FileText,
  Edit3, Pin, Loader2, Save, X
} from "lucide-react";
import { useGetCallerUserProfile } from "../hooks/useQueries";
import { isExecutiveRole } from "../lib/utils";
import { Role } from "../backend";
import { toast } from "sonner";

interface MeetingDetails {
  date: string;
  time: string;
  venue: string;
  stimulant: string;
  theme: string;
  speaker: string;
  dressCode: string;
  notes: string;
}

const DEFAULT_MEETING: MeetingDetails = {
  date: "",
  time: "",
  venue: "",
  stimulant: "",
  theme: "",
  speaker: "",
  dressCode: "",
  notes: "",
};

export default function ChapterMeetingPage() {
  const { data: userProfile } = useGetCallerUserProfile();
  const [meeting, setMeeting] = useState<MeetingDetails>(DEFAULT_MEETING);
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<MeetingDetails>(DEFAULT_MEETING);
  const [saving, setSaving] = useState(false);

  const userRole = userProfile?.role ?? Role.member;
  const isExec = isExecutiveRole(userRole);
  const hasMeeting = meeting.date || meeting.venue;

  const handleEdit = () => {
    setForm({ ...meeting });
    setEditing(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      // In a full implementation this would call a backend mutation
      setMeeting({ ...form });
      setEditing(false);
      toast.success("Meeting details updated!");
    } catch {
      toast.error("Failed to save meeting details");
    } finally {
      setSaving(false);
    }
  };

  const fields = [
    { icon: Calendar, label: "Date", value: meeting.date, key: "date", type: "date" },
    { icon: Clock, label: "Time", value: meeting.time, key: "time", type: "time" },
    { icon: MapPin, label: "Venue", value: meeting.venue, key: "venue", type: "text" },
    { icon: Coffee, label: "Stimulant", value: meeting.stimulant, key: "stimulant", type: "text" },
    { icon: Palette, label: "Theme", value: meeting.theme, key: "theme", type: "text" },
    { icon: Mic, label: "Speaker", value: meeting.speaker, key: "speaker", type: "text" },
    { icon: Shirt, label: "Dress Code", value: meeting.dressCode, key: "dressCode", type: "text" },
    { icon: FileText, label: "Notes", value: meeting.notes, key: "notes", type: "textarea" },
  ];

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-card p-5">
        <div className="flex items-center justify-between mb-1">
          <h1 className="font-poppins text-xl font-bold text-primary-700">Chapter Meeting</h1>
          {isExec && !editing && (
            <button
              onClick={handleEdit}
              className="flex items-center gap-1.5 px-3 py-1.5 gradient-primary text-white text-sm font-semibold font-poppins rounded-lg hover:opacity-90 transition-opacity"
            >
              <Edit3 className="w-3.5 h-3.5" />
              {hasMeeting ? "Edit" : "Set Meeting"}
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground font-inter">Official chapter meeting details</p>
      </div>

      {/* Edit Form */}
      {editing && isExec && (
        <div className="bg-white rounded-xl shadow-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-poppins font-semibold text-foreground">Edit Meeting Details</h2>
            <button onClick={() => setEditing(false)} className="p-1 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <form onSubmit={handleSave} className="space-y-3">
            {fields.map(({ label, key, type }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-foreground mb-1 font-poppins">{label}</label>
                {type === "textarea" ? (
                  <textarea
                    value={form[key as keyof MeetingDetails]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm font-inter focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                  />
                ) : (
                  <input
                    type={type}
                    value={form[key as keyof MeetingDetails]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-3 py-2 rounded-lg border border-border text-sm font-inter focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder={`Enter ${label.toLowerCase()}...`}
                  />
                )}
              </div>
            ))}
            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="flex-1 gradient-primary text-white font-poppins font-semibold py-2.5 rounded-lg disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Meeting
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="px-4 py-2.5 border border-border rounded-lg text-sm font-inter text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Meeting Details Card */}
      {hasMeeting ? (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="gradient-primary px-5 py-4">
            <h2 className="font-poppins font-bold text-white text-lg">
              {meeting.theme || "Chapter Meeting"}
            </h2>
            {meeting.date && (
              <p className="text-white/80 text-sm font-inter mt-0.5">
                {new Date(meeting.date).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                {meeting.time && ` · ${meeting.time}`}
              </p>
            )}
          </div>

          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {fields.filter(f => f.value && f.key !== "notes").map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground font-poppins uppercase tracking-wide">{label}</p>
                  <p className="text-sm font-inter text-foreground mt-0.5">{value}</p>
                </div>
              </div>
            ))}
          </div>

          {meeting.notes && (
            <div className="px-5 pb-5">
              <div className="bg-muted/50 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-primary-500" />
                  <span className="text-xs font-semibold text-muted-foreground font-poppins uppercase tracking-wide">Notes & Instructions</span>
                </div>
                <p className="text-sm font-inter text-foreground leading-relaxed whitespace-pre-wrap">{meeting.notes}</p>
              </div>
            </div>
          )}

          {isExec && (
            <div className="px-5 pb-5">
              <button className="flex items-center gap-2 px-4 py-2 border border-gold text-gold rounded-lg text-sm font-semibold font-poppins hover:bg-gold-50 transition-colors">
                <Pin className="w-4 h-4" />
                Pin This Meeting
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-card p-10 text-center">
          <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="font-poppins font-semibold text-foreground">No Meeting Scheduled</p>
          <p className="text-sm text-muted-foreground font-inter mt-1">
            {isExec ? "Click 'Set Meeting' to add meeting details." : "Check back later for meeting details."}
          </p>
        </div>
      )}
    </div>
  );
}
