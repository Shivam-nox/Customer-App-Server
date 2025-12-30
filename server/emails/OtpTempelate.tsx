import * as React from 'react';
import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Heading,
  Hr,
  Preview,
} from '@react-email/components';

interface OtpTemplateProps {
  otp: string;
}

export const OtpTemplate = ({ otp }: OtpTemplateProps) => {
  return (
    <Html>
      <Head />
      <Preview>Your Zapygo Login Code</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={logo}>ZAPYGO</Heading>
          
          <Text style={paragraph}>
            Use the code below to log in or sign up. This code will expire in 10 minutes.
          </Text>

          <Section style={codeBox}>
            <Text style={codeText}>{otp}</Text>
          </Section>

          <Text style={paragraph}>
            If you didn't request this, you can safely ignore this email.
          </Text>

          <Hr style={hr} />
          
          <Text style={footer}>
            Zapygo Technologies • Efficient Fuel Delivery
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

// --- STYLES (Minimalist Black & White) ---
const main = {
  backgroundColor: '#ffffff',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif',
};

const container = {
  margin: '0 auto',
  padding: '40px 20px',
  maxWidth: '500px',
};

const logo = {
  fontSize: '24px',
  fontWeight: '900',
  letterSpacing: '-1px',
  color: '#000000',
  marginBottom: '24px',
};

const paragraph = {
  fontSize: '16px',
  lineHeight: '26px',
  color: '#444444',
  marginBottom: '20px',
};

const codeBox = {
  background: '#F4F4F5',
  borderRadius: '8px',
  padding: '24px',
  textAlign: 'center' as const,
  marginBottom: '24px',
};

const codeText = {
  fontSize: '32px',
  fontWeight: '700',
  letterSpacing: '8px',
  color: '#000000',
  margin: '0',
  fontFamily: 'monospace',
};

const hr = {
  borderColor: '#E5E5E5',
  margin: '40px 0 20px',
};

const footer = {
  fontSize: '12px',
  color: '#888888',
  textAlign: 'center' as const,
};

export default OtpTemplate;