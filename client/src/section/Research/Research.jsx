import React from 'react';
import { motion } from 'framer-motion';
import researchData from '../../../public/data/research.json';
import styles from './styles/research.module.scss';

const Research = () => {
  const { focusAreas, technologyTranslation, innovationAchievements } = researchData;

  return (
    <div className={styles.researchPage}>
      <h1 className={styles.researchTitle}>
        <div>
          R&D Specializations & Key{' '}
          <span
            style={{
              background: 'var(--primary)',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
            }}
          >
            Research Areas
          </span>
        </div>
        <div className={styles.bottomLine}></div>
      </h1>

      <div className={styles.focusGrid}>
        {focusAreas.map((focus, index) => (
          <motion.div
            key={focus.title}
            className={styles.focusCard}
            whileInView={{ opacity: 1, y: 0 }}
            initial={{ opacity: 0, y: 30 }}
            transition={{ type: 'spring', stiffness: 100, damping: 15, delay: (index % 4) * 0.1 }}
            viewport={{ once: true }}
          >
            <h3 className={styles.focusCardTitle}>{focus.title}</h3>

            <div className={styles.focusCardSection}>
              <span className={styles.focusCardLabel}>
                {focus.areas.length > 1 ? 'Focus Areas' : 'Focus Area'}
              </span>
              <ul>
                {focus.areas.map((area) => (
                  <li key={area}>{area}</li>
                ))}
              </ul>
            </div>

            <div className={styles.focusCardSection}>
              <span className={styles.focusCardLabel}>Potential Industry Linkages</span>
              <ul>
                {focus.linkages.map((link) => (
                  <li key={link}>{link}</li>
                ))}
              </ul>
            </div>
          </motion.div>
        ))}
      </div>

      <div className={styles.statsGrid}>
        <motion.div
          className={styles.statsCard}
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          viewport={{ once: true }}
        >
          <h3 className={styles.statsCardTitle}>{technologyTranslation.heading}</h3>
          <ul>
            {technologyTranslation.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          className={styles.statsCard}
          whileInView={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: 30 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15, delay: 0.1 }}
          viewport={{ once: true }}
        >
          <h3 className={styles.statsCardTitle}>{innovationAchievements.heading}</h3>
          <ul>
            {innovationAchievements.items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </motion.div>
      </div>
    </div>
  );
};

export default Research;
