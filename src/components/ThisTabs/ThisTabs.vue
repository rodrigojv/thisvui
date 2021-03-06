<template>
  <div :class="getContainerClasses">
    <div :id="id" :class="getClasses">
      <div class="tab-slider-wrapper">
        <span
          class="tab-slider"
          v-bind:style="{ width: sliderWidth + 'px', left: sliderLeft + 'px' }"
        ></span>
      </div>
      <ul>
        <li
          v-for="(tab, index) in tabs"
          v-bind:class="{ 'is-tab-active': tab.isActive }"
          :key="`${id}${index}`"
        >
          <a
            @click="selectTab(index)"
            :class="tab.isActive ? getLinkClasses : ''"
            :ref="`${id}${index}`"
          >
            <span
              v-if="tab.icon"
              :class="tab.isActive ? `icon` : `icon ${tab.iconClass}`"
            >
              <this-icon :icon="tab.icon"></this-icon>
            </span>
            <span v-if="tab.name" v-text="tab.name"></span>
          </a>
        </li>
      </ul>
    </div>
    <div :class="`${getBodyClasses}`">
      <slot></slot>
    </div>
  </div>
</template>

<script>
import syntax from "../../mixins/syntax";
import alignment from "../../mixins/alignment";
import sizes from "../../mixins/sizes";
import common from "../../mixins/common";
import CssArchitect from "../../utils/css-architect";
import ThisIcon from "../ThisIcon/ThisIcon";

export default {
  name: "ThisTabs",
  components: { ThisIcon },
  mixins: [common, syntax, alignment, sizes],
  props: {
    selected: Number,
    isToggle: {
      type: [String, Boolean]
    },
    isToggleRounded: {
      type: [String, Boolean]
    },
    isBorderless: {
      type: [String, Boolean]
    },
    isBoxed: {
      type: [String, Boolean]
    },
    targetClass: {
      type: String
    },
    activeClass: {
      type: String
    }
  },
  computed: {
    /**
     * Dynamically build the css classes for the target element
     * @returns { A String with the chained css classes }
     */
    getClasses: function() {
      const cssArchitect = new CssArchitect("tabs");
      cssArchitect.addClass(this.getSyntaxModifiers);
      cssArchitect.addClass(this.getSizesModifiers);
      cssArchitect.addClass(this.getAlignmentModifiers);
      cssArchitect.addClass("is-boxed", this.getBoolean(this.isBoxed));
      cssArchitect.addClass("is-toggle", this.getBoolean(this.isToggle));
      cssArchitect.addClass(
        "is-toggle is-toggle-rounded",
        this.getBoolean(this.isToggleRounded)
      );
      cssArchitect.addClass(
        "is-borderless",
        this.getBoolean(this.isBorderless)
      );
      cssArchitect.addClass(this.targetClass);
      return cssArchitect.getClasses();
    },
    /**
     * Dynamically build the css classes for the tabs body
     * @returns { A String with the chained css classes }
     */
    getBodyClasses: function() {
      const cssArchitect = new CssArchitect("tabs-body");
      cssArchitect.addClass(
        "is-borderless",
        this.getBoolean(this.isBorderless)
      );
      cssArchitect.addClass("is-clipped");
      cssArchitect.addClass(this.getSizesModifiers);
      return cssArchitect.getClasses();
    },
    /**
     * Dynamically build the css classes for the container element
     * @returns { A String with the chained css classes }
     */
    getContainerClasses: function() {
      const cssArchitect = new CssArchitect("tabs-container");
      return cssArchitect.getClasses();
    },
    /**
     * Dynamically build the css classes for the link items
     * @returns { A String with the chained css classes }
     */
    getLinkClasses: function() {
      const cssArchitect = new CssArchitect();
      cssArchitect.addClass(this.activeClass);
      return cssArchitect.getClasses();
    }
  },
  data() {
    return {
      tabs: [],
      activeTabIndex: this.selected || 0,
      sliderWidth: 0,
      sliderLeft: 0
    };
  },
  created() {
    this.tabs = this.$children;
  },
  methods: {
    selectTab(index) {
      if (this.activeTabIndex === index) return;

      if (this.activeTabIndex < this.tabs.length) {
        this.tabs[this.activeTabIndex].activate(
          this.activeTabIndex,
          index,
          false
        );
      }
      this.tabs[index].activate(this.activeTabIndex, index, true);
      this.activeTabIndex = index;
      this.configSlider();
      this.$emit("change", index);
    },
    configSlider() {
      let ref = `${this.id}${this.activeTabIndex}`;
      let currentLi = this.$refs[ref][0];
      let borderWidth =
        this.isBoxed || this.isToggle || this.isToggleRounded ? 2 : 0;
      this.sliderWidth = currentLi.scrollWidth + borderWidth;
      this.sliderLeft = currentLi.offsetLeft;
    }
  },
  mounted() {
    if (this.activeTabIndex < this.tabs.length) {
      this.tabs[this.activeTabIndex].isActive = true;
    }
    this.$nextTick(function() {
      // Code that will run only after the
      // entire view has been rendered
      this.configSlider();
    });
  }
};
</script>
