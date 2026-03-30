import { Communicate } from 'edge-tts-universal';

async function test() {
  try {
    const tts1 = new Communicate('Hello world', 'en-US-ChristopherNeural');
    console.log('tts1 voice:', (tts1 as any).voice);
    
    const tts2 = new Communicate('Hello world', { voice: 'en-US-ChristopherNeural' });
    console.log('tts2 voice:', (tts2 as any).voice);
  } catch (e) {
    console.error(e);
  }
}

test();
