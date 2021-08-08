import React from 'react';
import {Image, Text, TouchableOpacity, View} from 'react-native';
import tailwind from 'tailwind-rn';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

import {getColorByUuid} from '../utils';

dayjs.extend(utc);

const formatLastSentAt = (date: string) => {
  const d = dayjs.utc(date).local();
  const isSameDay = dayjs.utc(date).isAfter(dayjs().startOf('day'));
  const isWithinWeek = dayjs().diff(dayjs.utc(date), 'days') < 6;

  if (isSameDay) {
    return d.format('h:mm a');
  } else if (isWithinWeek) {
    return d.format('ddd');
  } else {
    return d.format('MMM D');
  }
};

type Props = {
  item: any;
  onSelectConversation: (item: any) => void;
};

export default function ConversationItem({item, onSelectConversation}: Props) {
  const {read, customer = {}, messages = []} = item;
  const {id: customerId, name, email, profile_photo_url: avatarUrl} = customer;
  const display = name || email || 'Anonymous User';
  // We order messages in reverse, so the latest is first
  const [message] = messages;
  const {body, created_at: timestamp} = message;
  const text = body || '...';
  const lastSentAt = formatLastSentAt(timestamp);
  const formatted = text
    .split('\n')
    .map((str: string) => str.trim())
    .filter((str: string) => str.length > 0)
    .join(' ');
  const color = getColorByUuid(customerId);

  return (
    <TouchableOpacity
      activeOpacity={0.5}
      onPress={() => onSelectConversation(item)}
    >
      <View
        style={tailwind('flex-row p-3 border-b border-gray-100 items-center')}
      >
        {avatarUrl ? (
          <Image
            style={tailwind(
              'mr-3 w-10 h-10 rounded-full items-center justify-center'
            )}
            source={{
              uri: avatarUrl,
            }}
          />
        ) : (
          <View
            style={tailwind(
              `mr-3 w-10 h-10 bg-${color}-500 rounded-full items-center justify-center`
            )}
          >
            <Text style={tailwind('text-white text-base')}>
              {display.slice(0, 1).toUpperCase()}
            </Text>
          </View>
        )}
        <View>
          <Text style={tailwind(`mb-1 text-base ${read ? '' : 'font-bold'}`)}>
            {display}
          </Text>
          <Text
            style={tailwind(read ? 'text-gray-500' : 'text-gray-700 font-bold')}
          >
            {formatted.length > 40
              ? formatted.slice(0, 32).concat('...')
              : formatted}
            {' · '}
            {lastSentAt}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}
