import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

const FeatureList = [
  {
    title: "Fast",
    Svg: require("@site/static/img/undraw_docusaurus_mountain.svg").default,
    description: <>No Compiling, but Fine-tune Reactivity and No Virtual DOM Diff; Zero Dependencies, 3KB (gzip)</>,
  },
  {
    title: "Pragmatic",
    Svg: require("@site/static/img/undraw_docusaurus_tree.svg").default,
    description: <>16 APIs, 1 Hour Learning; No Transpiling, but Readable Template and Fully TS Support</>,
  },
  {
    title: "Productive",
    Svg: require("@site/static/img/undraw_docusaurus_react.svg").default,
    description: <>Structural Code, but Nicely Reusable Logic and Flexible Organization of Concerns</>,
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx("col col--4")}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
