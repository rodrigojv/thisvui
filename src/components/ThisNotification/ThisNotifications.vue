<template>
  <div :id="id" class="notifications">
    <this-notification
      v-for="(notification, index) in notifications"
      @close-notification="removeNotification(notification)"
      show-delete-button="true"
      :key="`Notification${index}`"
      :is-warning="notification.warning"
      :is-info="notification.info"
      :is-success="notification.success"
      :is-danger="notification.danger"
      :is-primary="notification.primary"
      :timeout="notification.timeout"
      :delay="notification.delay"
      :class="notification.class"
      transition="fade"
    >
      <p class="has-text-weight-bold">{{ notification.text }}</p>
    </this-notification>
  </div>
</template>

<script>
import { NotificationBus } from "./notification-bus";
import ThisNotification from "./ThisNotification";
import common from "../../mixins/common";

export default {
  name: "ThisNotifications",
  mixins: [common],
  components: {
    ThisNotification,
    Notification
  },
  data() {
    return {
      notifications: NotificationBus.notifications
    };
  },
  methods: {
    /**
     * Removes a notification from the Notification Bus
     */
    removeNotification: function(notification) {
      NotificationBus.removeNotification(notification);
    }
  }
};
</script>
