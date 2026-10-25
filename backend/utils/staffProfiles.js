export const STAFF_PROFILES = {
  Puja: {
    fullName: 'Puja Gupta',
    role: 'Licensed Esthetician & Founder',
    experience: '15+ years of experience',
    specialties: ['Opened Kaya 8 years ago', 'GLO Skin Body Certified', 'Acne & Anti-Aging Specialist'],
    bio: 'Her approach is healing, holistic and result oriented. She treats more than the surface to cultivate a radiant, lasting glow.',
  },
  Sia: {
    fullName: 'Sia',
    role: 'Licensed Esthetician',
    experience: '7 years of experience',
    specialties: ['Medical esthetics', 'Luxury spa experience'],
    bio: 'Sia loves making people happy and helping them feel beautiful in their own skin.',
  },
};

export const profileFor = (name) => STAFF_PROFILES[name] || STAFF_PROFILES.Puja;