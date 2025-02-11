import {test, expect, describe, vi} from "vitest";
import {html, reactive, component} from "../src/index.js";
import {sleep} from "./sleep.js";

describe("component", () => {
  test("component should have expected props and children.", async () => {
    const Name = component((props) => {
      expect(props.name).toBe("John");
      expect(props.children).toEqual(["Doe"]);
      return html.div([props.name + props.children[0]]);
    });
    expect(Name({name: "John"}, ["Doe"]).outerHTML).toBe(`<div>JohnDoe</div>`);
  });

  test("component should update reactive props.", async () => {
    const Name = component((props) => html.div([props.select("name")]));

    const state = reactive().state("name", "John").join();
    const div = Name({name: state.select("name")});
    document.body.append(div);
    expect(div.outerHTML).toBe(`<div>John</div>`);

    state.name = "Doe";
    await sleep(0);
    expect(div.outerHTML).toBe(`<div>Doe</div>`);

    document.body.removeChild(div);
  });

  test("component should update state derived from reactive props.", async () => {
    const Name = component((props, reactive) => {
      const state = reactive()
        .computed("name", () => props.name.toUpperCase())
        .join();
      return html.div([state.select("name")]);
    });

    const state = reactive().state("name", "John").join();
    const div = Name({name: state.select("name")});
    document.body.append(div);
    expect(div.outerHTML).toBe(`<div>JOHN</div>`);

    state.name = "Doe";
    await sleep(0);
    expect(div.outerHTML).toBe(`<div>DOE</div>`);

    document.body.removeChild(div);
  });

  test("component should update reactive children.", async () => {
    const Name = component(({children}) => html.div(children));

    const state = reactive().state("name", "John").join();
    const div = Name({}, [state.select("name")]);
    document.body.append(div);
    expect(div.outerHTML).toBe(`<div>John</div>`);

    state.name = "Doe";
    await sleep(0);
    expect(div.outerHTML).toBe(`<div>Doe</div>`);

    document.body.removeChild(div);
  });

  test("component should dispose effects after being removed.", async () => {
    const mock = vi.fn(() => {});

    const Dispose = component((props, reactive) => {
      reactive()
        .effect(() => mock)
        .join();
      return html.div(["hello world"]);
    });

    const state = reactive().state("show", true).join();
    const node = html.div([state.select((d) => d.show && Dispose())]);
    document.body.append(node);

    state.show = false;
    await sleep(0);
    expect(node.outerHTML).toBe(`<div></div>`);
    expect(mock).toHaveBeenCalledTimes(1);
  });

  test("component should return a node with a dispose method.", async () => {
    const Name = component((props) => html.div([props.name]));
    const node = Name({name: "John"});
    expect(node.dispose).toBeInstanceOf(Function);
  });

  test("component should dispose effects after calling dispose method.", async () => {
    const mock = vi.fn(() => {});

    const Dispose = component((props, reactive) => {
      reactive()
        .effect(() => mock)
        .join();
      return html.div(["hello world"]);
    });

    const node = Dispose();
    node.dispose();
    expect(mock).toHaveBeenCalledTimes(1);
  });

  test("component should dispose multiple compositions after calling dispose method.", async () => {
    const mock1 = vi.fn(() => {});
    const mock2 = vi.fn(() => {});

    const Dispose = component((props, reactive) => {
      reactive()
        .effect(() => mock1)
        .join();

      reactive()
        .effect(() => mock2)
        .join();
      return html.div(["hello world"]);
    });

    const node = Dispose();
    node.dispose();
    expect(mock1).toHaveBeenCalledTimes(1);
    expect(mock2).toHaveBeenCalledTimes(1);
  });
});
