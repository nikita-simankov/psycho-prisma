import { Body, Button, Container, Head, Hr, Html, Preview, Section, Text } from "@react-email/components";

// Calibre's transactional email: paper background, a serif heading, one action, small print below.
// Email clients ignore web fonts and CSS variables, so the palette is written out and the fonts
// fall back to Georgia and the system sans.
const INK = "#1a1c21";
const MUTED = "#5a5e67";
const PAPER = "#f6f4ef";
const RULE = "#e2ded5";
const COBALT = "#2b44d6";
const SERIF = "Literata, 'Iowan Old Style', Georgia, serif";
const SANS = "Onest, 'Segoe UI', Helvetica, Arial, sans-serif";

export type EmailContent = {
  // One line shown in the inbox beside the subject.
  preview: string;
  // Who the email is from, above the heading: the organization, or Calibre for account emails.
  sender: string;
  heading: string;
  paragraphs: string[];
  // A quoted note from the sender, such as a round's message.
  quote?: string;
  action: { label: string; url: string };
  // Small print under the button: how long the link works, what to do if unexpected.
  notes: string[];
};

export function CalibreEmail({ preview, sender, heading, paragraphs, quote, action, notes }: EmailContent) {
  return (
    <Html>
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ backgroundColor: PAPER, margin: 0, padding: "32px 12px", fontFamily: SANS, color: INK }}>
        <Container style={{ maxWidth: 520, margin: "0 auto" }}>
          <Text style={{ fontFamily: "Menlo, Consolas, monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: MUTED, margin: "0 0 12px" }}>
            {sender}
          </Text>
          <Section style={{ backgroundColor: "#ffffff", border: `1px solid ${RULE}`, borderRadius: 6, padding: "32px 28px" }}>
            <Text style={{ fontFamily: SERIF, fontSize: 26, lineHeight: "32px", fontWeight: 500, margin: "0 0 20px" }}>{heading}</Text>
            {paragraphs.map((paragraph, index) => (
              <Text key={index} style={{ fontSize: 16, lineHeight: "24px", margin: "0 0 14px" }}>
                {paragraph}
              </Text>
            ))}
            {quote && (
              <Text style={{ fontFamily: SERIF, fontStyle: "italic", fontSize: 16, lineHeight: "24px", color: MUTED, borderLeft: `2px solid ${RULE}`, paddingLeft: 14, margin: "4px 0 18px", whiteSpace: "pre-line" }}>
                {quote}
              </Text>
            )}
            <Button
              href={action.url}
              style={{ backgroundColor: COBALT, color: "#ffffff", fontSize: 15, fontWeight: 500, borderRadius: 4, padding: "12px 20px", marginTop: 8, display: "inline-block" }}
            >
              {action.label}
            </Button>
            <Hr style={{ borderColor: RULE, margin: "28px 0 16px" }} />
            {notes.map((note, index) => (
              <Text key={index} style={{ fontSize: 13, lineHeight: "20px", color: MUTED, margin: "0 0 6px" }}>
                {note}
              </Text>
            ))}
            <Text style={{ fontSize: 12, lineHeight: "18px", color: MUTED, margin: "12px 0 0", wordBreak: "break-all" }}>{action.url}</Text>
          </Section>
          <Text style={{ fontFamily: SERIF, fontSize: 13, color: MUTED, margin: "16px 0 0", textAlign: "center" }}>Calibre</Text>
        </Container>
      </Body>
    </Html>
  );
}
