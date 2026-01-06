import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TagChipsInputComponent } from './tag-chips-input.component';
import type { TagSuggestionResponse } from '../../models';

describe('TagChipsInputComponent', () => {
  let component: TagChipsInputComponent;
  let fixture: ComponentFixture<TagChipsInputComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TagChipsInputComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TagChipsInputComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit tagsChange when adding a tag', () => {
    const spy = jest.spyOn(component.tagsChange, 'emit');
    fixture.componentRef.setInput('tags', ['tag1']);

    component.draft.set('tag2');
    component.commitDraft();

    expect(spy).toHaveBeenCalledWith(['tag1', 'tag2']);
    expect(component.draft()).toBe('');
  });

  it('should not add duplicate tags', () => {
    const spy = jest.spyOn(component.tagsChange, 'emit');
    fixture.componentRef.setInput('tags', ['tag1']);

    component.draft.set('tag1');
    component.commitDraft();

    expect(spy).not.toHaveBeenCalled();
  });

  it('should normalize tags to lowercase', () => {
    const spy = jest.spyOn(component.tagsChange, 'emit');
    fixture.componentRef.setInput('tags', []);

    component.draft.set('  TAG  WITH  SPACES  ');
    component.commitDraft();

    expect(spy).toHaveBeenCalledWith(['tag with spaces']);
  });

  it('should remove tags', () => {
    const spy = jest.spyOn(component.tagsChange, 'emit');
    fixture.componentRef.setInput('tags', ['tag1', 'tag2', 'tag3']);

    component.remove('tag2');

    expect(spy).toHaveBeenCalledWith(['tag1', 'tag3']);
  });

  it('should pick suggestion from list', () => {
    const spy = jest.spyOn(component.tagsChange, 'emit');
    const suggestions: TagSuggestionResponse[] = [
      { name: 'suggestion1', count: 10 },
      { name: 'suggestion2', count: 5 }
    ];
    fixture.componentRef.setInput('suggestions', suggestions);
    fixture.componentRef.setInput('tags', []);

    component.pickSuggestion('suggestion1');

    expect(spy).toHaveBeenCalledWith(['suggestion1']);
    expect(component.draft()).toBe('');
  });

  it('should handle arrow key navigation in suggestions', () => {
    const suggestions: TagSuggestionResponse[] = [
      { name: 'suggestion1', count: 10 },
      { name: 'suggestion2', count: 5 },
      { name: 'suggestion3', count: 3 }
    ];
    fixture.componentRef.setInput('suggestions', suggestions);
    component.draft.set('sug');

    const arrowDown = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    component.onKeydown(arrowDown);
    expect(component.activeIndex()).toBe(1);

    component.onKeydown(arrowDown);
    expect(component.activeIndex()).toBe(2);

    const arrowUp = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    component.onKeydown(arrowUp);
    expect(component.activeIndex()).toBe(1);
  });

  it('should emit searchChange on input', () => {
    const spy = jest.spyOn(component.searchChange, 'emit');
    const input = document.createElement('input');
    const event = new Event('input');
    Object.defineProperty(event, 'target', { value: input, enumerable: true });
    input.value = 'test query';

    component.onInput(event);

    expect(spy).toHaveBeenCalledWith('test query');
    expect(component.draft()).toBe('test query');
  });

  it('should remove last tag on backspace when draft is empty', () => {
    const spy = jest.spyOn(component.tagsChange, 'emit');
    fixture.componentRef.setInput('tags', ['tag1', 'tag2']);

    component.draft.set('');
    const backspace = new KeyboardEvent('keydown', { key: 'Backspace' });
    component.onKeydown(backspace);

    expect(spy).toHaveBeenCalledWith(['tag1']);
  });
});
