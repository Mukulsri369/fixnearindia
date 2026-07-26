import { Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button, Card, Input, Label, Textarea } from "../components/ui.jsx";

export default function Contact() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="text-4xl font-bold">Contact us</h1>
      <p className="mt-4 text-muted-foreground">
        Questions about a repair, your technician application, or a partnership? Reach out.
      </p>

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <Card>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              toast.success("Thanks! We'll get back to you within one business day.");
              e.currentTarget.reset();
            }}
          >
            <div>
              <Label htmlFor="name">Name</Label>
              <Input id="name" required />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" required />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" rows={5} required />
            </div>
            <Button type="submit">Send message</Button>
          </form>
        </Card>

        <div className="space-y-4">
          <Card>
            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Email</p>
                <p className="text-sm text-muted-foreground">support@fixnear.in</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-sm text-muted-foreground">+91 90000 00000</p>
              </div>
            </div>
          </Card>
          <Card>
            <div className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="font-medium">Office</p>
                <p className="text-sm text-muted-foreground">Pune, Maharashtra, India</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
