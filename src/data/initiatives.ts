import type { Initiative } from '@/types';

export const initiatives: Initiative[] = [
  {
    id: 'engagement-hub',
    category: 'Community',
    author: 'amaa@ashesi.edu.gh',
    title: 'Engagement Hub',
    description:
      'A centralized space for youth to connect with local leaders, attend civic workshops, and co-design community solutions. Monthly meetups in Kumasi bring together 50+ students and mentors.',
    endorsements: 47,
    volunteersNeeded: 10,
    volunteersJoined: 6,
    comments: [
      {
        id: 'c1',
        author: 'kwesi@knust.edu.gh',
        content: 'This is exactly what Kumasi needs. Count me in for the next meetup!',
        timestamp: '12/10/2026',
      },
      {
        id: 'c2',
        author: 'anonymous',
        content: 'Would love to see this expand to Accra as well.',
        timestamp: '13/10/2026',
      },
    ],
    postedAt: '10/10/2026',
  },
  {
    id: 'youth-coding-workspace',
    category: 'Tech & Coding',
    author: 'nana@ithubafrica.org',
    title: 'Youth Coding - Hands On Workspace Offering Digital Skills',
    description:
      'Free weekend coding bootcamps for ages 16–25. Learn HTML, CSS, JavaScript, and Python from industry mentors. Laptops provided on-site. Currently running in 3 communities across Accra.',
    endorsements: 89,
    volunteersNeeded: 5,
    volunteersJoined: 3,
    comments: [
      {
        id: 'c3',
        author: 'amaa@ashesi.edu.gh',
        content: 'Attended last Saturday. The mentors are incredible. Highly recommend!',
        timestamp: '11/10/2026',
      },
    ],
    postedAt: '08/10/2026',
    link: 'https://ithubafrica.org',
  },
  {
    id: 'scholarship-info-sessions',
    category: 'Education',
    author: 'adwoa@civio.org',
    title: 'Scholarship Info Sessions for WAEC Graduates',
    description:
      'Bi-weekly sessions covering Mastercard Foundation, DAAD, Chevening, and Commonwealth scholarships. Learn about eligibility, essay writing, and fee waiver codes. Held online and in-person at KNUST.',
    endorsements: 124,
    volunteersNeeded: 8,
    volunteersJoined: 5,
    comments: [
      {
        id: 'c4',
        author: 'kwesi@knust.edu.gh',
        content: 'The DAAD session helped me submit my application. Got the waiver code too!',
        timestamp: '09/10/2026',
      },
      {
        id: 'c5',
        author: 'anonymous',
        content: 'Can these sessions be recorded for those who can not attend live?',
        timestamp: '10/10/2026',
      },
    ],
    postedAt: '05/10/2026',
  },
  {
    id: 'community-garden',
    category: 'Environment',
    author: 'kojo@greenleaf.gh',
    title: 'Campus Community Garden Initiative',
    description:
      'Transforming unused campus land into sustainable community gardens. Students grow vegetables, learn composting, and distribute produce to local food banks. Partnering with 4 universities in Ghana.',
    endorsements: 56,
    volunteersNeeded: 15,
    volunteersJoined: 9,
    comments: [],
    postedAt: '03/10/2026',
  },
  {
    id: 'micro-grant-fund',
    category: 'Business',
    author: 'abena@startupbridge.org',
    title: 'Youth Micro-Grant Fund for Student Entrepreneurs',
    description:
      'Small grants of $100–$500 for student-led businesses and social enterprises. Application requires a 2-minute pitch video and a simple budget. Funded by alumni donations and local businesses.',
    endorsements: 72,
    volunteersNeeded: 4,
    volunteersJoined: 2,
    comments: [
      {
        id: 'c6',
        author: 'nana@ithubafrica.org',
        content: 'This would pair perfectly with the coding workspace. Tech + funding = impact.',
        timestamp: '06/10/2026',
      },
    ],
    postedAt: '01/10/2026',
    link: 'https://startupbridge.org',
  },
  {
    id: 'policy-forum',
    category: 'Public Policy',
    author: 'yaw@civicvoice.gh',
    title: 'Youth Policy Forum: Education Reform Town Hall',
    description:
      'Monthly town halls where students discuss education policy with local government representatives. Topics include free SHS sustainability, university admissions transparency, and digital literacy in public schools.',
    endorsements: 38,
    volunteersNeeded: 6,
    volunteersJoined: 4,
    comments: [
      {
        id: 'c7',
        author: 'adwoa@civio.org',
        content: 'The admissions transparency topic is crucial. Civio can help provide data for these discussions.',
        timestamp: '07/10/2026',
      },
    ],
    postedAt: '28/09/2026',
  },
  {
    id: 'robotics-club',
    category: 'Tech & Coding',
    author: 'kofi@stemghana.org',
    title: 'After-School Robotics & STEM Club',
    description:
      'Hands-on robotics, electronics, and physics workshops for junior high students. Meets twice weekly at 5 community centers. Goal: spark interest in engineering careers among underrepresented students.',
    endorsements: 61,
    volunteersNeeded: 12,
    volunteersJoined: 7,
    comments: [],
    postedAt: '25/09/2026',
  },
  {
    id: 'book-drive',
    category: 'Education',
    author: 'amaa@ashesi.edu.gh',
    title: 'Rural Community Library & Book Drive',
    description:
      'Collecting textbooks, novels, and educational materials to stock a community library in the Eastern Region. Also seeking volunteers to run weekend reading programs for children ages 6–14.',
    endorsements: 93,
    volunteersNeeded: 20,
    volunteersJoined: 11,
    comments: [
      {
        id: 'c8',
        author: 'kojo@greenleaf.gh',
        content: 'I have boxes of textbooks from KNUST. How do I donate?',
        timestamp: '02/10/2026',
      },
    ],
    postedAt: '20/09/2026',
  },
];
